#!/usr/bin/env node

/**
 * BLS Data Pipeline — builds pre-computed LQ + trend data for all MSAs.
 *
 * Downloads BLS flat files (no API key, no rate limits):
 *   - sm.area, sm.series, sm.data.0.Current (metro data)
 *   - ce.series + per-supersector ce.data files (national data)
 *
 * Computes LQ for every MSA × supersector and 10-year monthly trends.
 * Outputs:
 *   - public/data/lq_all_metros.json (screening + full detail data)
 *
 * Usage:  node scripts/build-screening-data.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "public", "data");
const OUTPUT_FILE = join(OUTPUT_DIR, "lq_all_metros.json");

const SM_BASE = "https://download.bls.gov/pub/time.series/sm/";
const CE_BASE = "https://download.bls.gov/pub/time.series/ce/";

const SUPERSECTOR_CODES = [
  "00000000", "15000000", "30000000", "40000000", "50000000",
  "55000000", "60000000", "65000000", "70000000", "80000000", "90000000",
];

const SUPERSECTOR_LABELS = {
  "15000000": "Mining, Logging & Construction",
  "30000000": "Manufacturing",
  "40000000": "Trade, Transportation & Utilities",
  "50000000": "Information",
  "55000000": "Financial Activities",
  "60000000": "Professional & Business Services",
  "65000000": "Education & Health Services",
  "70000000": "Leisure & Hospitality",
  "80000000": "Other Services",
  "90000000": "Government",
};

// National CES unseasoned series IDs we need.
//
// NOTE: each supersector maps to an ARRAY of national series that are SUMMED to
// form the LQ denominator. This matters for Mining, Logging & Construction:
// the state/metro (SM) survey publishes a combined "15000000" supersector, but
// the national (CE) survey has no equivalent — it reports Mining & Logging
// (CEU1000000001) and Construction (CEU2000000001) separately. Mapping 15000000
// to a non-existent "CEU1500000001" silently produced a null LQ for that sector
// in every metro. Summing the two national components reconstructs the correct
// denominator to match the SM combined series.
const NATIONAL_SERIES = {
  "00000000": ["CEU0000000001"],
  "15000000": ["CEU1000000001", "CEU2000000001"], // Mining & Logging + Construction
  "30000000": ["CEU3000000001"],
  "40000000": ["CEU4000000001"],
  "50000000": ["CEU5000000001"],
  "55000000": ["CEU5500000001"],
  "60000000": ["CEU6000000001"],
  "65000000": ["CEU6500000001"],
  "70000000": ["CEU7000000001"],
  "80000000": ["CEU8000000001"],
  "90000000": ["CEU9000000001"],
};

// CES data files for each supersector (smaller than downloading the full file)
const CE_DATA_FILES = [
  "ce.data.00a.TotalNonfarm.Employment",
  "ce.data.10a.MiningAndLogging.Employment",
  "ce.data.20a.Construction.Employment",
  "ce.data.30a.Manufacturing.Employment",
  "ce.data.40a.TradeTransportationAndUtilities.Employment",
  "ce.data.50a.Information.Employment",
  "ce.data.55a.FinancialActivities.Employment",
  "ce.data.60a.ProfessionalBusinessServices.Employment",
  "ce.data.65a.EducationAndHealthCare.Employment",
  "ce.data.70a.LeisureAndHospitality.Employment",
  "ce.data.80a.OtherServices.Employment",
  "ce.data.90a.Government.Employment",
];

const TREND_START_YEAR = 2015;

// Headline growth window. NSA data requires comparing the same calendar month.
const GROWTH_WINDOW_YEARS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchText(url) {
  console.log(`  Downloading ${url.split("/").pop()} ...`);
  const res = await fetch(url, {
    headers: { "User-Agent": "lq-dashboard/1.0 (contact@metrolq.com)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseTSV(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  const headers = lines[0].split("\t").map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t").map((c) => c.trim());
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cols[j] ?? "";
    }
    rows.push(row);
  }
  return rows;
}

function slugify(name) {
  return name.toLowerCase().replace(/['']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function periodToMonth(period) {
  return period.replace("M", "").padStart(2, "0");
}

// ---------------------------------------------------------------------------
// Step 1: Download all flat files
// ---------------------------------------------------------------------------

async function downloadAllFiles() {
  console.log("\n[1/5] Downloading BLS flat files (no API key needed)...");

  const [areaText, seriesText, dataText, ...ceTexts] = await Promise.all([
    fetchText(SM_BASE + "sm.area"),
    fetchText(SM_BASE + "sm.series"),
    fetchText(SM_BASE + "sm.data.0.Current"),
    ...CE_DATA_FILES.map((f) => fetchText(CE_BASE + f)),
  ]);

  return { areaText, seriesText, dataText, ceTexts };
}

// ---------------------------------------------------------------------------
// Step 2: Parse national CES data from flat files
// ---------------------------------------------------------------------------

function parseNationalData(ceTexts) {
  console.log("\n[2/5] Parsing national CES data from flat files...");

  // Every national series ID we care about, across all supersectors
  const wantedSeries = new Set(Object.values(NATIONAL_SERIES).flat());
  // seriesId -> which supersector code(s) it contributes to
  const seriesToCode = {};
  for (const [code, ids] of Object.entries(NATIONAL_SERIES)) {
    for (const id of ids) seriesToCode[id] = code;
  }

  // seriesId -> dateKey -> { value, year, period, date }
  const bySeries = {};

  for (const text of ceTexts) {
    const rows = parseTSV(text);
    for (const row of rows) {
      const sid = row.series_id;
      if (!wantedSeries.has(sid)) continue;
      if (row.period === "M13") continue; // annual average

      const val = parseFloat(row.value);
      if (isNaN(val)) continue;

      const dateKey = `${row.year}-${row.period}`;
      if (!bySeries[sid]) bySeries[sid] = {};
      bySeries[sid][dateKey] = {
        value: val,
        year: row.year,
        period: row.period,
        date: `${row.year}-${periodToMonth(row.period)}`,
      };
    }
  }

  // Warn loudly if an expected national series is missing entirely — this is the
  // failure mode that previously produced silent null LQs.
  for (const sid of wantedSeries) {
    if (!bySeries[sid] || Object.keys(bySeries[sid]).length === 0) {
      console.warn(`  WARNING: national series ${sid} (supersector ${seriesToCode[sid]}) returned no data`);
    }
  }

  // date -> supersectorCode -> summed value
  const nationalByDate = {};
  // supersectorCode -> most recent summed value
  const nationalCurrent = {};

  for (const [code, ids] of Object.entries(NATIONAL_SERIES)) {
    // Union of all dateKeys across this supersector's component series
    const dateKeys = new Set();
    for (const id of ids) {
      for (const dk of Object.keys(bySeries[id] ?? {})) dateKeys.add(dk);
    }

    for (const dateKey of dateKeys) {
      // Only emit a value when EVERY component series has data for this date.
      // A partial sum (e.g. Construction without Mining) would understate the
      // denominator and inflate the LQ.
      const parts = ids.map((id) => bySeries[id]?.[dateKey]);
      if (parts.some((p) => p === undefined)) continue;

      const total = parts.reduce((sum, p) => sum + p.value, 0);
      const { year, period, date } = parts[0];

      if (parseInt(year) >= TREND_START_YEAR) {
        if (!nationalByDate[date]) nationalByDate[date] = {};
        nationalByDate[date][code] = total;
      }

      if (!nationalCurrent[code] || dateKey > nationalCurrent[code].dateKey) {
        nationalCurrent[code] = { value: total, year, period, dateKey };
      }
    }
  }

  // Convert nationalCurrent to simple map
  const national = {};
  for (const [code, entry] of Object.entries(nationalCurrent)) {
    national[code] = { value: entry.value, year: entry.year, period: entry.period };
  }

  const expectedCodes = Object.keys(NATIONAL_SERIES).length;
  if (Object.keys(national).length < expectedCodes) {
    const missing = Object.keys(NATIONAL_SERIES).filter((c) => !national[c]);
    console.warn(`  WARNING: no national value for supersector(s): ${missing.join(", ")}`);
  }

  console.log(
    `  National data: ${Object.keys(national).length}/${expectedCodes} supersectors, period ${national["00000000"]?.period} ${national["00000000"]?.year}`
  );
  console.log(`  National trend data: ${Object.keys(nationalByDate).length} months`);

  return { national, nationalByDate };
}

// ---------------------------------------------------------------------------
// Step 3: Parse metro data and build all series by date
// ---------------------------------------------------------------------------

function parseMetroData(areaText, seriesText, dataText) {
  console.log("\n[3/5] Parsing metro flat files...");

  const areas = parseTSV(areaText);
  const areaNames = {};
  for (const row of areas) areaNames[row.area_code] = row.area_name;
  console.log(`  ${areas.length} areas parsed`);

  const allSeries = parseTSV(seriesText);
  const seriesLookup = {};
  let relevantCount = 0;
  for (const row of allSeries) {
    if (row.seasonal !== "U") continue;
    if (row.data_type_code !== "01") continue;
    if (!SUPERSECTOR_CODES.includes(row.industry_code)) continue;
    seriesLookup[row.series_id] = {
      stateCode: row.state_code,
      areaCode: row.area_code,
      industryCode: row.industry_code,
    };
    relevantCount++;
  }
  console.log(`  ${relevantCount} relevant metro series`);

  const dataRows = parseTSV(dataText);
  console.log(`  ${dataRows.length} data rows parsed`);

  // Build:
  // latestBySeries: series_id -> { dateKey, year, period, value }
  // trendBySeries: series_id -> [ { date, year, period, value } ]
  const latestBySeries = {};
  const trendBySeries = {};

  for (const row of dataRows) {
    const sid = row.series_id;
    if (!seriesLookup[sid]) continue;
    if (row.period === "M13") continue;

    const val = parseFloat(row.value);
    if (isNaN(val)) continue;

    const dateKey = `${row.year}-${row.period}`;
    const existing = latestBySeries[sid];
    if (!existing || dateKey > existing.dateKey) {
      latestBySeries[sid] = { dateKey, year: row.year, period: row.period, value: val };
    }

    // Trend data
    const year = parseInt(row.year);
    if (year >= TREND_START_YEAR) {
      if (!trendBySeries[sid]) trendBySeries[sid] = [];
      trendBySeries[sid].push({
        date: `${row.year}-${periodToMonth(row.period)}`,
        year: row.year,
        period: row.period,
        value: val,
      });
    }
  }

  console.log(`  ${Object.keys(latestBySeries).length} series with current data`);
  console.log(`  ${Object.keys(trendBySeries).length} series with trend data`);

  return { areaNames, seriesLookup, latestBySeries, trendBySeries };
}

// ---------------------------------------------------------------------------
// Step 4: Compute LQ + trends for all metros
// ---------------------------------------------------------------------------

function buildAllMetroData(
  { areaNames, seriesLookup, latestBySeries, trendBySeries },
  { national, nationalByDate }
) {
  console.log("\n[4/5] Computing LQ and trends for all metros...");

  if (!(national["00000000"]?.value > 0)) throw new Error("No national total nonfarm data");

  // Area identity only. Values are read per-date below, not from here: picking
  // the latest point per series independently lets one late-reporting sector
  // divide its employment by another month's total, inside a single row.
  const areaData = {};
  for (const [sid] of Object.entries(latestBySeries)) {
    const info = seriesLookup[sid];
    const key = `${info.stateCode}-${info.areaCode}`;
    if (!areaData[key]) {
      areaData[key] = { stateCode: info.stateCode, areaCode: info.areaCode };
    }
  }

  // key -> date -> industryCode -> value
  const areaByDate = {};
  for (const [sid, points] of Object.entries(trendBySeries)) {
    const info = seriesLookup[sid];
    const key = `${info.stateCode}-${info.areaCode}`;
    if (!areaByDate[key]) areaByDate[key] = {};
    for (const p of points) {
      if (!areaByDate[key][p.date]) areaByDate[key][p.date] = {};
      areaByDate[key][p.date][info.industryCode] = p.value;
    }
  }

  /**
   * The month a metro's headline figures are reported for: its most recent
   * month that also has national data, so local and national shares are drawn
   * from the same month.
   *
   * National CES publishes ahead of metro CES — at the time of writing, national
   * is a month further along. Reading "current" from each side's own latest
   * month therefore divided one month's metro share by another month's national
   * share, while labelling the row with the metro's month. That is what made the
   * headline LQ disagree with the last point of its own trend line.
   */
  function resolveAsOf(key) {
    const dates = Object.keys(areaByDate[key] ?? {}).sort();
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i];
      if (!areaByDate[key][date]["00000000"]) continue;
      const nat = nationalByDate[date];
      if (!nat || !nat["00000000"]) continue;
      return date;
    }
    return null;
  }

  const asOfUsed = new Set();

  // Group trend data by area
  const areaTrends = {};
  for (const [sid, points] of Object.entries(trendBySeries)) {
    const info = seriesLookup[sid];
    const key = `${info.stateCode}-${info.areaCode}`;
    if (!areaTrends[key]) areaTrends[key] = {};
    if (!areaTrends[key][info.industryCode]) areaTrends[key][info.industryCode] = [];
    areaTrends[key][info.industryCode].push(...points);
  }

  const results = [];

  for (const [key, area] of Object.entries(areaData)) {
    const areaName = areaNames[area.areaCode];
    if (!areaName) continue;
    if (area.areaCode === "00000") continue;

    // Everything below — metro sectors, metro total, national sectors, national
    // total — is read at this one month. Nothing here may fall back to another
    // month's value.
    const asOf = resolveAsOf(key);
    if (!asOf) continue;
    asOfUsed.add(asOf);

    const monthData = areaByDate[key][asOf];
    const natAtDate = nationalByDate[asOf];
    const totalNonfarm = monthData["00000000"];
    const nationalTotal = natAtDate["00000000"];
    if (!totalNonfarm || !nationalTotal) continue;

    const [asOfYear, asOfMonth] = asOf.split("-");
    area.dataYear = asOfYear;
    area.dataPeriod = `M${asOfMonth}`;

    const lqBySector = {};
    const sectors = [];

    for (const code of SUPERSECTOR_CODES) {
      if (code === "00000000") continue;
      const localValue = monthData[code];
      const nationalValue = natAtDate[code];
      // A sector absent at the as-of month is omitted rather than filled from an
      // earlier month — a stale numerator over a current total is not an LQ.
      if (!localValue || !nationalValue || nationalValue === 0) continue;

      const localShare = localValue / totalNonfarm;
      const nationalShare = nationalValue / nationalTotal;
      const lq = Math.round((localShare / nationalShare) * 100) / 100;

      lqBySector[code] = lq;
      sectors.push({
        code,
        label: SUPERSECTOR_LABELS[code],
        employment: localValue,
        pctOfTotal: Math.round(localShare * 1000) / 10,
        nationalEmployment: nationalValue,
        nationalPctOfTotal: Math.round(nationalShare * 1000) / 10,
        lq,
        // LQ > 1.0 means the metro produces more than it consumes — the surplus
        // is exported. This is definitional (economic base theory), not a
        // statistical threshold. Exactly 1.0 = produces precisely what it needs.
        classification: lq > 1.0 ? "Export" : lq < 1.0 ? "Import" : "Local",
        // Excess (basic) employment: jobs beyond what the metro needs to serve
        // itself. Computed from unrounded shares. This — not the LQ ratio — is
        // the magnitude an employment multiplier acts on.
        excessEmployment: Math.round((localValue - totalNonfarm * nationalShare) * 10) / 10,
      });
    }

    if (sectors.length === 0) continue;

    // Build trend series
    const trendSeries = [];
    const areaT = areaTrends[key] || {};

    for (const code of SUPERSECTOR_CODES) {
      if (code === "00000000") continue;
      const points = areaT[code];
      if (!points || points.length === 0) continue;

      const totalPoints = areaT["00000000"] || [];
      const totalByDate = {};
      for (const p of totalPoints) totalByDate[p.date] = p.value;

      const trendData = [];
      for (const p of points) {
        const localTotal = totalByDate[p.date] || 0;
        const natAtDate = nationalByDate[p.date] || {};
        const natTotal = natAtDate["00000000"] || 0;
        const natValue = natAtDate[code] || 0;

        let lq = null;
        if (localTotal > 0 && natTotal > 0 && natValue > 0) {
          const localShare = p.value / localTotal;
          const natShare = natValue / natTotal;
          lq = Math.round((localShare / natShare) * 100) / 100;
        }

        trendData.push({
          date: p.date,
          employment: p.value,
          lq,
        });
      }

      trendData.sort((a, b) => a.date.localeCompare(b.date));

      trendSeries.push({
        supersectorCode: code,
        label: SUPERSECTOR_LABELS[code],
        data: trendData,
      });
    }

    // Overall employment growth, month-matched over GROWTH_WINDOW_YEARS.
    //
    // BLS CES metro data is NOT seasonally adjusted, so only over-the-year
    // comparisons are valid. A previous version compared the first point in the
    // series (January 2015) to the latest available month, mixing a seasonal
    // trough against a seasonal peak -- inflating growth by ~5-6 points -- and
    // spanning an arbitrary window rather than a decade.
    let employmentGrowthPct = null;
    let growthStartDate = null;
    let growthEndDate = null;
    const totalNonfarmTrend = areaT["00000000"];
    if (totalNonfarmTrend && totalNonfarmTrend.length >= 2) {
      const sortedTrend = [...totalNonfarmTrend].sort((a, b) => a.date.localeCompare(b.date));
      const last = sortedTrend[sortedTrend.length - 1];
      const [ey, em] = last.date.split("-");
      const startDate = `${parseInt(ey, 10) - GROWTH_WINDOW_YEARS}-${em}`;
      const start = sortedTrend.find((p) => p.date === startDate);
      if (start && start.value > 0) {
        employmentGrowthPct = Math.round(((last.value - start.value) / start.value) * 1000) / 10;
        growthStartDate = start.date;
        growthEndDate = last.date;
      }
    }

    // Summary metrics
    const sorted = [...sectors].sort((a, b) => b.lq - a.lq);
    const topExport = sorted[0];
    const exportCount = sectors.filter((s) => s.lq > 1.0).length;

    // Export base: total jobs beyond local need. Sum of positive excess only.
    // Conservative floor — cross-hauling within broad supersectors nets out and
    // is therefore invisible here, so the true base is larger.
    const exportBaseJobs =
      Math.round(sectors.reduce((sum, s) => sum + Math.max(0, s.excessEmployment), 0) * 10) / 10;
    const exportBasePct =
      totalNonfarm > 0 ? Math.round((exportBaseJobs / totalNonfarm) * 1000) / 10 : 0;
    const largestSector = [...sectors].sort((a, b) => b.pctOfTotal - a.pctOfTotal)[0];

    // Classify area type: MSA vs Metropolitan Division
    const areaType = (areaName.includes("Division") || parseInt(area.areaCode) >= 90000)
      ? "division" : "msa";

    results.push({
      stateCode: area.stateCode,
      areaCode: area.areaCode,
      name: areaName,
      slug: slugify(areaName),
      areaType,
      totalEmployment: totalNonfarm,
      employmentGrowthPct,
      growthStartDate,
      growthEndDate,
      dataYear: area.dataYear,
      dataPeriod: area.dataPeriod,
      topExportSector: topExport.label,
      topExportLQ: topExport.lq,
      exportCount,
      exportBaseJobs,
      exportBasePct,
      largestSector: largestSector.label,
      largestSectorPct: largestSector.pctOfTotal,
      sectors,
      lq: lqBySector,
      trends: trendSeries,
    });
  }

  results.sort((a, b) => b.totalEmployment - a.totalEmployment);
  console.log(`  ${results.length} metros with complete data`);

  const asOfList = [...asOfUsed].sort();
  console.log(
    `  As-of month: ${asOfList.join(", ")}${
      asOfList.length > 1 ? " (metros report at different months)" : ""
    }`
  );
  const natLatest = `${national["00000000"]?.year}-${periodToMonth(national["00000000"]?.period)}`;
  if (asOfList.length && asOfList[asOfList.length - 1] !== natLatest) {
    console.log(
      `  National data runs to ${natLatest}; LQ is computed at each metro's own month, so the newer national months are not used yet.`
    );
  }

  return { results, asOfList };
}

// ---------------------------------------------------------------------------
// Step 5: Write output
// ---------------------------------------------------------------------------

function writeOutput(results, asOfList) {
  console.log("\n[5/5] Writing output...");
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(join(OUTPUT_DIR, "metros"), { recursive: true });

  // The month the LQs are actually computed at, not the newest national month
  // available. These differ — national CES publishes ahead of metro CES — and
  // reporting the national month here claimed a freshness the figures did not
  // have. Each metro also carries its own dataPeriod; this is the newest in use.
  const latestAsOf = asOfList[asOfList.length - 1];
  const [asOfYear, asOfMonth] = latestAsOf.split("-");

  // 1. Screening file (no trends — keeps it small for the filter page)
  const screeningMetros = results.map(({ trends, ...rest }) => rest);
  const screeningOutput = {
    generatedAt: new Date().toISOString(),
    nationalDataPeriod: `M${asOfMonth} ${asOfYear}`,
    metroCount: results.length,
    metros: screeningMetros,
  };
  writeFileSync(OUTPUT_FILE, JSON.stringify(screeningOutput));
  const screenSize = (Buffer.byteLength(JSON.stringify(screeningOutput)) / 1024 / 1024).toFixed(2);
  console.log(`  Written lq_all_metros.json (${screenSize} MB, ${results.length} metros)`);

  // 2. Per-metro detail files (with trends)
  for (const metro of results) {
    const detailFile = join(OUTPUT_DIR, "metros", `${metro.slug}.json`);
    writeFileSync(detailFile, JSON.stringify(metro));
  }
  console.log(`  Written ${results.length} per-metro detail files to public/data/metros/`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== BLS LQ Data Pipeline (flat files only — zero API calls) ===");

  const { areaText, seriesText, dataText, ceTexts } = await downloadAllFiles();
  const nationalData = parseNationalData(ceTexts);
  const metroData = parseMetroData(areaText, seriesText, dataText);
  const { results, asOfList } = buildAllMetroData(metroData, nationalData);
  writeOutput(results, asOfList);

  console.log("\nDone! No API calls were made.");
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
