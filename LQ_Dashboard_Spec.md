# Location Quotient Dashboard — Product Spec

## Overview

Build a public-facing web dashboard that computes and displays Location Quotient (LQ) economic base analysis for ~390 U.S. metropolitan statistical areas using free Bureau of Labor Statistics (BLS) employment data. The tool helps anyone trying to understand what drives a city's economy — economic development professionals, site selectors, investors, researchers, journalists, and the merely curious — identify export sectors, assess concentration risk, compare metros side-by-side, and track 10-year employment trends.

The app should be a React frontend (Vite), deployed to Vercel as a standalone public website. It should be designed for SEO discoverability (people searching "location quotient calculator", "economic base analysis tool", "MSA employment comparison", etc.) and structured to support ad revenue via Google AdSense or similar ad networks.

### Product Vision

This fills a gap in the market. The BLS publishes raw employment data, but there's no clean, free, public tool that automatically computes location quotients across all MSAs with visualization and comparison features. The closest equivalents are:
- The BLS OEWS page (computes occupational LQs but not industry supersector LQs)
- Academic tools that are clunky and not publicly accessible
- Paid platforms like EMSI/Lightcast that charge thousands per year

This tool democratizes economic base analysis with a polished, modern UI.

### Monetization

- **Google AdSense** or similar display ad network — place ad units in non-intrusive positions (sidebar on desktop, between sections on mobile). The content is data-heavy with high dwell time, which should perform well for CPM-based ads.
- **Potential future premium tier** — gated features like PDF export, custom screening saves, API access, or detailed sub-sector breakdowns could be paywalled later.
- **SEO strategy** — each MSA should have its own URL route (e.g., `/metro/washington-dc-md`) so individual city pages are indexable by search engines. People searching "Washington DC economic base" or "Houston employment by industry" should land on the relevant page.

### Audience

This is a general-purpose economic analysis tool, not a vertical one. No single
audience is primary: the underlying question — what does this metro actually do
for a living, and how exposed is it — is the same whoever is asking, so the copy
should stay legible to all of them and address none of them exclusively.

- Economic development organizations and chambers of commerce
- Site selection consultants and businesses weighing expansion or relocation
- Urban planning and public policy researchers
- Investors and analysts assessing regional exposure
- Business, economics, and planning students
- Journalists covering local economies
- Anyone deciding where to move, work, or build a career

Note: the creator comes from real estate, and early drafts of this spec and the
site treated real estate investors as the primary audience. That framing has been
removed deliberately — it narrowed a broadly useful tool and left every other
reader out. Concrete examples (DC and Government, Houston and Energy, Detroit and
Manufacturing) are worth keeping; they teach the concept to any reader. Framing
that presumes the reader is underwriting a deal is not.

---

## What Is a Location Quotient?

LQ measures how concentrated a local area is in a given industry relative to the national average.

**Formula:**

```
LQ = (Local industry employment / Total local employment) / (National industry employment / Total national employment)
```

**Interpretation:**
- **LQ > 1.0** → Export sector. The area produces more than it consumes locally — it "exports" to the rest of the world. This is the economic engine that brings outside money into the region.
- **LQ = 1.0** → Balanced. Produces precisely what it consumes.
- **LQ < 1.0** → Import sector. The area is underrepresented; it imports this activity from elsewhere.

**Threshold — 1.0, not 1.2 (decided; do not reintroduce a buffer):**

The export/import cutoff is **1.0 everywhere** — classification, chart colors, export counts. This is definitional arithmetic from economic base theory (a surplus is exported), not a statistical inference, so there is nothing to significance-test and no basis for a buffer.

An earlier build classified Export at LQ ≥ 1.2. That constant appeared exactly once in this spec, scoped to a single summary card, and was then over-applied to the global classification — contradicting the conceptual definition above and the bar chart's own 1.0 reference line. It is also the wrong instrument for significance:
- New York, Professional & Business Services: LQ **1.16**, ~**220,000** excess jobs → a 1.2 cutoff discards it as "Local"
- Guayama, PR, Government: LQ **2.21**, ~**2,600** excess jobs → a 1.2 cutoff keeps it

No ratio threshold can fix this, because LQ is a ratio and significance is a magnitude. Note also that classical hypothesis testing does not help: with metro employment in the hundreds of thousands, a two-proportion z-test flags LQ 1.02 at p < 0.0001. Every deviation is "significant," so the test cannot discriminate.

**Significance — excess (basic) employment:**

```
expected = metro total employment × national industry share
excess   = actual − expected          (identical to: actual × (1 − 1/LQ))
```

Excess employment is the count of jobs beyond what the metro needs to serve itself — the export base, in jobs. It is the quantity an employment multiplier (1.5–3×) acts on. The `(1 − 1/LQ)` term is the share of that sector's jobs which are exporting: LQ 2.0 → 50% exported, LQ 1.5 → 33%, LQ 1.05 → 4.8%.

A metro's **export base** = the sum of *positive* excess across sectors. This is a conservative floor: cross-hauling within broad supersectors (shipping out truck parts while importing electronics — both "Manufacturing") nets out and is invisible, so the true base is larger.

Implementation lives in `src/lib/lqMetrics.ts` (single source of truth) and is mirrored in `scripts/build-screening-data.mjs`. Classification is derived from the LQ at read time in `useLQData`, so data files built under the old 1.2 threshold cannot leak a stale classification into the UI.

**Month-matching — every LQ is computed within a single month (decided; do not reintroduce "latest available"):**

An LQ compares a local share to a national share. Both must be drawn from the
*same month*. This applies to the headline LQ exactly as it does to the trend
line, and it is not a freshness trade-off:

- National CES publishes ahead of metro CES — typically by one month.
- Each metro row is labelled with the metro's own month (`dataPeriod`). Taking
  "current" from each side's latest month therefore divided, say, a May metro
  share by a June national share, and labelled the result May. The row already
  claimed to be May; there was never a June LQ to give up.
- This is what made the headline LQ disagree with the last point of its own
  trend line — Las Vegas Leisure & Hospitality read 2.32 in the table and 2.37
  in the trend, and 358 of 600 sampled sector rows disagreed.

The build resolves one **as-of month** per metro — its most recent month that
also has national data — and reads *everything* at it: metro sectors, metro
total, national sectors, national total. A sector with no data at the as-of
month is omitted, never filled from an earlier month; a stale numerator over a
current total is not an LQ.

Do not select "the latest value per series" on either side. Independently-latest
values let one late-reporting sector divide its employment by a different
month's total *within a single row*, which no amount of matching the national
side would catch.

`nationalDataPeriod` in the screening file reports the as-of month actually
used, not the newest national month downloaded. The newer national months are
deliberately unused until metro CES catches up.

**Excess employment has exactly one source (decided):**

`scripts/build-screening-data.mjs` computes per-sector `excessEmployment` from
**unrounded** shares and stores it. The app reads that value. It must not
recompute it from `nationalPctOfTotal`, which is stored rounded to one decimal
(e.g. 11.0% for a true 11.045%): recomputing off the rounded share drifted the
export base by up to ~800 jobs against the pipeline's own `exportBaseJobs`, so
the same quantity read differently in the table, the CSV, and the metro page.

The invariant to preserve: **summing positive per-sector `excessEmployment`
reproduces `exportBaseJobs` exactly, for every metro.** The live BLS API path in
`blsApi.ts` still calls `excessEmployment()` because it has no precomputed value
to read — that is the only caller that should.

**Why it matters:**
- High-LQ sectors drive employment demand → population growth → local spending (and, downstream, housing demand)
- Concentration risk: if a city's dominant export sector contracts, the multiplier effect drags everything down (e.g., DC and government cuts, Detroit and auto manufacturing)
- Employment multiplier: each export-sector job typically supports 1.5–3 additional service-sector jobs

---

## BLS API Details

### Registration & Authentication

- **API URL:** `https://api.bls.gov/publicAPI/v2/timeseries/data/`
- **API Key:** `b91db61638054b0397caa7209d528425`
- **Method:** POST with JSON body
- **Rate limits (v2):** 500 queries/day, 50 series per query, 20 years of data per query

### Request Format

```json
{
  "seriesid": ["SMU11477640000000001", "SMU11477649000000001"],
  "startyear": "2015",
  "endyear": "2025",
  "registrationkey": "b91db61638054b0397caa7209d528425"
}
```

### Response Format

```json
{
  "status": "REQUEST_SUCCEEDED",
  "Results": {
    "series": [
      {
        "seriesID": "SMU11477640000000001",
        "data": [
          {
            "year": "2025",
            "period": "M11",
            "periodName": "November",
            "value": "1140.2",
            "footnotes": [{}]
          },
          ...
        ]
      }
    ]
  }
}
```

- Data is returned in reverse chronological order (most recent first)
- `period` format is `M01` through `M12` (monthly) and `M13` (annual average)
- `value` is a string, always in thousands for employment series
- Not all months may be available for all series

### Series ID Format — State & Metro Area CES (SM prefix)

```
SMU{STATE}{AREA}{SUPERSECTOR_INDUSTRY}{DATATYPE}

Example: SMU11477640000000001
  SM  = Survey prefix (State & Metro)
  U   = Not seasonally adjusted
  11  = State code (DC = 11)
  47764 = Area code (5 digits)
  00000000 = Supersector + Industry code (8 digits, 00000000 = total nonfarm)
  01  = Data type (01 = All Employees, Thousands)
```

### Series ID Format — National CES (CE prefix)

```
CEU{SUPERSECTOR_INDUSTRY}{DATATYPE}

Example: CEU0000000001
  CE  = Survey prefix (National CES)
  U   = Not seasonally adjusted
  00000000 = Supersector + Industry code (00000000 = total nonfarm)
  01  = Data type (01 = All Employees, Thousands)
```

### Supersector Codes

These are the 10 industry supersectors used for LQ computation:

| Code | Label | Description |
|------|-------|-------------|
| `00000000` | Total Nonfarm | All nonfarm employment (denominator) |
| `05000000` | Total Private | Private sector only (skip for LQ) |
| `15000000` | Mining, Logging & Construction | Includes mining, logging, and construction |
| `30000000` | Manufacturing | Durable + nondurable goods |
| `40000000` | Trade, Transportation & Utilities | Wholesale + retail + transport + utilities |
| `50000000` | Information | Tech, media, telecom, data processing |
| `55000000` | Financial Activities | Finance, insurance, real estate |
| `60000000` | Professional & Business Services | Consulting, legal, defense contractors, management |
| `65000000` | Education & Health Services | Private education + healthcare |
| `70000000` | Leisure & Hospitality | Hotels, restaurants, entertainment, tourism |
| `80000000` | Other Services | Associations, advocacy, repair, religious orgs |
| `90000000` | Government | Federal + state + local government |

### National Series IDs (for LQ denominator)

| Supersector | National Series ID |
|-------------|-------------------|
| Total Nonfarm | `CEU0000000001` |
| Mining, Logging & Construction | `CEU1500000001` |
| Manufacturing | `CEU3000000001` |
| Trade, Transportation & Utilities | `CEU4000000001` |
| Information | `CEU5000000001` |
| Financial Activities | `CEU5500000001` |
| Professional & Business Services | `CEU6000000001` |
| Education & Health Services | `CEU6500000001` |
| Leisure & Hospitality | `CEU7000000001` |
| Other Services | `CEU8000000001` |
| Government | `CEU9000000001` |

### How to Build a Metro Area Series ID

For any metro, you need the state FIPS code and the area code. To get total nonfarm for DC-MD division:

```
State: 11 (DC)
Area: 47764 (Washington, DC-MD division)
Supersector: 00000000 (total nonfarm)
Data type: 01

Series ID: SMU11477640000000001
```

For government employment in the same area:
```
Series ID: SMU11477649000000001
              ^^     ^^^^^^^^^
              state  supersector 90000000
```

### Key Metro Area Codes

A worked sample: major US metros, plus the DC-area divisions the tool was first tested against. It is illustrative, not a curated set the product is built around — the app covers all ~390 MSAs and ~37 divisions equally. The full list is available at https://www.bls.gov/eag/home.htm. A comprehensive area code list can be scraped from the BLS EAG page or downloaded from https://download.bls.gov/pub/time.series/sm/ (the `sm.area` file contains all area codes).

> **This table is reference documentation, not a data source.** The app resolves
> every metro from `public/data/lq_all_metros.json`, built from BLS CES data by
> `scripts/build-screening-data.mjs`. Do not hand-maintain a parallel list in
> application code — an earlier `METROS` constant drifted from this table and
> silently served the wrong metro's data.
>
> Three area codes here were wrong, each a copy-paste of a neighbouring row that
> resolved to a real but *different* metro, so nothing errored:
>
> | Metro | Was | Actually is | Correct |
> |---|---|---|---|
> | Washington (Full MSA) | 12580 | Baltimore-Columbia-Towson | 47900 |
> | Phoenix-Mesa-Chandler | 33100 | Miami-Fort Lauderdale | 38060 |
> | New York-Newark-Jersey City | 35004 | Nassau County-Suffolk County | 35620 |
>
> Validate any change to this table against `lq_all_metros.json` (match on
> `stateCode` + `areaCode`) before relying on it.

| State Code | Area Code | Metro Name |
|-----------|-----------|------------|
| 11 | 47764 | Washington, DC-MD (Division) |
| 51 | 11694 | Arlington-Alexandria-Reston, VA-WV (NoVA Division) |
| 24 | 23224 | Frederick-Gaithersburg-Bethesda, MD (Division) |
| 11 | 47900 | Washington-Arlington-Alexandria, DC-VA-MD-WV (Full MSA) |
| 51 | 47260 | Virginia Beach-Norfolk-Newport News, VA-NC (Hampton Roads) |
| 13 | 12060 | Atlanta-Sandy Springs-Alpharetta, GA |
| 37 | 16740 | Charlotte-Concord-Gastonia, NC-SC |
| 19 | 19780 | Des Moines-West Des Moines, IA |
| 55 | 31540 | Madison, WI |
| 36 | 35620 | New York-Newark-Jersey City, NY-NJ |
| 06 | 31080 | Los Angeles-Long Beach-Anaheim, CA |
| 17 | 16980 | Chicago-Naperville-Elgin, IL-IN-WI |
| 48 | 26420 | Houston-The Woodlands-Sugar Land, TX |
| 48 | 19100 | Dallas-Fort Worth-Arlington, TX |
| 12 | 33100 | Miami-Fort Lauderdale-Pompano Beach, FL |
| 06 | 41860 | San Francisco-Oakland-Berkeley, CA |
| 25 | 14460 | Boston-Cambridge-Newton, MA-NH |
| 53 | 42660 | Seattle-Tacoma-Bellevue, WA |
| 27 | 33460 | Minneapolis-St. Paul-Bloomington, MN-WI |
| 47 | 34980 | Nashville-Davidson-Murfreesboro-Franklin, TN |
| 49 | 41620 | Salt Lake City, UT |
| 37 | 39580 | Raleigh-Cary, NC |
| 39 | 17140 | Cincinnati, OH-KY-IN |
| 29 | 41180 | St. Louis, MO-IL |
| 24 | 12580 | Baltimore-Columbia-Towson, MD |
| 42 | 38300 | Pittsburgh, PA |
| 08 | 19740 | Denver-Aurora-Lakewood, CO |
| 41 | 38900 | Portland-Vancouver-Hillsboro, OR-WA |
| 48 | 12420 | Austin-Round Rock-Georgetown, TX |
| 04 | 38060 | Phoenix-Mesa-Chandler, AZ |
| 26 | 19820 | Detroit-Warren-Dearborn, MI |
| 12 | 36740 | Orlando-Kissimmee-Sanford, FL |
| 12 | 45300 | Tampa-St. Petersburg-Clearwater, FL |

**To get the full list of all ~390 MSAs programmatically:**
Download the BLS area codes file from `https://download.bls.gov/pub/time.series/sm/sm.area` — this is a tab-delimited text file with all area codes and names. Filter for `area_type_code = 4` (MSA) and `area_type_code = 6` (Metropolitan Division).

---

## Features to Build (in priority order)

### Phase 1: Single MSA LQ View

**The core feature.** User selects a metro area from a searchable dropdown. The app:

1. Fetches national employment data (11 series — total nonfarm + 10 supersectors)
2. Fetches the selected metro's employment data (same 11 series)
3. Computes LQ for each supersector
4. Displays:
   - **Horizontal bar chart** — supersectors sorted by LQ, with a reference line at LQ = 1.0. Bars to the right of 1.0 are export sectors (color them green/blue), bars to the left are import sectors (gray/red).
   - **Summary cards** — Top export sector (name + LQ), number of export sectors (LQ > 1.0), export base (total excess employment in jobs, and as % of total), top sector concentration (% of total employment for the largest sector, flag if > 25%)
   - **Data table** — Industry, Employment (thousands), % of Total, LQ, Classification (Export/Local/Import)

**Caching:** Cache national data in memory (it's the same for every metro). Cache metro results in a Map so switching back to a previously viewed metro is instant.

### Phase 2: Side-by-Side MSA Comparison

User selects 2–3 metros. The app:

1. Fetches data for each metro (reusing cached national data)
2. Displays a **grouped horizontal bar chart** with all metros overlaid, one color per metro
3. Shows side-by-side summary tables for each metro
4. Highlights the biggest LQ differences between the selected metros

This is the feature that made the DC-MD vs NoVA comparison so powerful — being able to see that DC's export base is Government (LQ 1.92) while NoVA's is Professional & Business Services (LQ 1.91) tells a completely different economic story about two neighbouring markets.

### Phase 3: 10-Year Trend Lines

For any selected metro, show how each supersector's employment and LQ has changed over 10 years.

1. Fetch 10 years of monthly data (use `startyear` and `endyear` parameters — may require two API calls since v2 allows 20 years per query, so 2015–2025 fits in one call)
2. Display **line charts** showing:
   - Employment level by supersector over time
   - LQ by supersector over time (requires computing LQ for each month using that month's national data)
3. Show a **10-year change summary table**: employment in year 1 vs year 10, % change, LQ then vs now

**Important:** For the 10-year LQ trend, you need national data for each time period too. Fetch national series for the same 10-year span and compute LQ monthly.

### Phase 4: Screening/Filtering Tool

The most powerful feature — search across all ~390 MSAs to find markets matching whatever criteria the reader cares about.

**Implementation approach:** Since you can't call the BLS API 390 times in real-time (rate limit: 500/day, and it would take minutes), this requires a **pre-computed data layer**:

1. **Data pipeline (runs periodically, e.g., monthly):** A Node.js or Python script that:
   - Downloads the BLS flat files from `https://download.bls.gov/pub/time.series/sm/` (these contain ALL series data in tab-delimited text files — no API rate limits)
   - Parses `sm.data.0.Current` (current data) for all metro areas
   - Computes LQ for every MSA × supersector combination
   - Outputs a single JSON file (`lq_data.json`) with all pre-computed metrics
   - This JSON file gets deployed with the app (or stored in a CDN/S3 bucket)

2. **Flat file download approach (recommended for bulk data):**
   - `sm.area` — all area codes and names
   - `sm.data.0.Current` — current month data for all series
   - `sm.industry` — industry code definitions
   - `sm.series` — series definitions (maps series IDs to area + industry + data type)
   - These are public, no API key needed, no rate limits

3. **Front-end screening UI:**
   - Filter controls: LQ range sliders per supersector, employment growth % range, total employment size, concentration threshold
   - Results table: sortable by any column, showing MSA name, total employment, top export sector, LQ for selected sector, 10-year growth, concentration score
   - Click any row to navigate to the full single-MSA view

**Example screening queries the team would run:**
- "Show me all MSAs where Education & Health Services LQ > 1.3 and total employment grew > 5% over 10 years" (finding healthcare-driven growth markets)
- "Show me MSAs where no single sector exceeds 20% of employment" (finding diversified economies)
- "Show me MSAs where Government LQ < 1.2 and Professional & Business Services LQ > 1.5" (finding private-sector-driven metros, avoiding DC-style government dependency)

---

## Technical Architecture

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)          │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Single   │  │ Compare  │  │  Screening    │  │
│  │ MSA View │  │ View     │  │  (uses JSON)  │  │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
│       │              │                │           │
│       ▼              ▼                ▼           │
│  ┌─────────────────────────────────────────────┐ │
│  │  BLS API Client (fetch, cache, compute LQ)  │ │
│  └────────────────────┬────────────────────────┘ │
│                       │                           │
└───────────────────────┼───────────────────────────┘
                        │
          ┌─────────────┼──────────────┐
          ▼                            ▼
  BLS API v2 (live)          Pre-computed JSON
  (Phases 1-3)               (Phase 4 screening)
  - 11 series per metro      - All ~390 MSAs
  - Real-time fetch           - Updated monthly
                              - From BLS flat files
```

### Tech Stack

- **Framework:** Next.js 14+ (preferred over Vite for SEO — supports SSG, dynamic meta tags, sitemap generation, and API routes for the BLS proxy). If starting with Vite for speed, plan to migrate to Next.js before launch.
- **Charts:** Recharts
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (free tier supports Next.js natively, generous limits)
- **Data pipeline (Phase 4):** Node.js script, output to static JSON in `/public/data/`
- **State management:** React state + useReducer
- **Ads:** Google AdSense (add container divs from day one, connect later)
- **Analytics:** Google Analytics 4 or Plausible (privacy-friendly alternative)
- **Domain:** Purchase a short, brandable domain (e.g., econbase.io, metrolq.com, exportbase.app)

### File Structure

```
lq-dashboard/
├── public/
│   └── data/
│       └── lq_all_metros.json    # Pre-computed (Phase 4)
├── src/
│   ├── components/
│   │   ├── LQBarChart.jsx
│   │   ├── CompareChart.jsx
│   │   ├── TrendChart.jsx
│   │   ├── DataTable.jsx
│   │   ├── MetroSelector.jsx
│   │   ├── ScreeningFilters.jsx
│   │   └── SummaryCards.jsx
│   ├── hooks/
│   │   ├── useBLSData.js         # API client + caching
│   │   └── useLQComputation.js   # LQ math
│   ├── data/
│   │   ├── metros.js             # Metro area code definitions
│   │   ├── supersectors.js       # Supersector code definitions
│   │   └── nationalSeries.js     # National series ID map
│   ├── utils/
│   │   └── blsApi.js             # BLS API fetch wrapper
│   ├── App.jsx
│   └── main.jsx
├── scripts/
│   └── build-screening-data.js   # Phase 4 data pipeline
├── package.json
└── vite.config.js
```

---

## Design Direction

Dark theme, data-dense, professional. Think Bloomberg terminal meets modern dashboard — but accessible to a general audience. Key elements:

- **Dark background** (`#0f1117`) with card surfaces (`#1a1d27`)
- **Monospace font** (JetBrains Mono) for data, clean sans-serif for labels
- **Color coding:** Blue for export sectors (LQ > 1.0), gray at exactly 1.0, red for import sectors (LQ < 1.0). The color break must match the 1.0 reference line — an earlier build drew the line at 1.0 but broke color at 1.2, rendering above-average sectors in "local" gray to the right of the line.
- **Gold reference line** at LQ = 1.0 on all bar charts
- **Minimal chrome** — the data is the interface
- **Responsive** — must work well on mobile (significant portion of traffic will be mobile)
- **Brand name:** Choose something generic and SEO-friendly, not "Clear Bay Capital" — this is a public tool. Something like "EconBase", "Metro LQ", "BaseMap", or "ExportBase". The creator can be credited in a footer ("Built by [name]").

### SEO & Routing Requirements

- **React Router** with defined routes:
  - `/` — Landing page with search, featured metros, explanation of LQs
  - `/metro/:slug` — Individual MSA page (e.g., `/metro/washington-dc-md`). Each page should be its own indexable URL with a unique `<title>` and `<meta description>`.
  - `/compare` — Comparison tool (query params for selected metros: `/compare?m1=washington-dc-md&m2=arlington-nova`)
  - `/screen` — Screening tool
  - `/about` — Educational content explaining economic base theory, LQs, multiplier effect
- **Meta tags:** Each MSA page needs `<title>` like "Washington, DC-MD Location Quotient Analysis | [Brand]" and a description like "Economic base analysis for the Washington, DC-MD metro division. Government LQ: 1.92, Professional Services LQ: 1.32. See which industries drive the DC economy."
- **Structured data (JSON-LD):** Add schema.org Dataset markup for each MSA page
- **Sitemap generation:** Auto-generate sitemap.xml with all MSA URLs
- **Pre-rendering / SSG:** For SEO, individual MSA pages should ideally be statically generated (Next.js would be better than Vite for this — consider migrating to Next.js if SEO is a priority). Alternatively, use a prerender service.

### Ad Placement Strategy

- **Desktop:** Leaderboard (728x90) above the chart area, medium rectangle (300x250) in a right sidebar on MSA detail pages
- **Mobile:** Banner (320x50) between the summary cards and the chart, medium rectangle between chart and data table
- **Never interrupt the core data experience** — ads should be clearly separated from the LQ content
- **Ad container divs** should be built into the layout from day one, even if AdSense isn't connected yet (use placeholder divs with a dashed border during development)
- **Lazy load ads** so they don't impact initial page load / Core Web Vitals

---

## Data Validation Notes

- Not all ~390 MSAs will have data for all 10 supersectors. Smaller metros may only publish total nonfarm + a few sectors. The app should gracefully handle missing data (show "N/A" rather than crashing).
- BLS employment values are in thousands (e.g., `1140.2` = 1,140,200 jobs). Display as-is with "K" suffix.
- Data is not seasonally adjusted (NSA). Over-the-year comparisons are valid; month-to-month comparisons are not (due to seasonality).

**Growth must be month-matched (decided; do not revert):**

Because CES metro data is NSA, every growth figure compares the **same calendar month, exactly 10 years apart** (e.g. May 2016 → May 2026). An earlier build compared the first point in the series (January 2015) to the latest available month, which:
- mixed a seasonal trough (January) against a seasonal peak — Cincinnati alone gained **4.7%** between Jan-2015 and Dec-2015 from seasonality with no real growth; and
- spanned an arbitrary window (11.3 years) while being labelled "10-Year Change".

The effect was an overstatement of roughly **5–6 percentage points** on every metro (Cincinnati read 14.4% instead of 8.3%; Kansas City 15.6% instead of 10.0%).

Implementation: `computeMatchedGrowth()` / `growthWindow()` in `src/lib/lqMetrics.ts`, mirrored by `GROWTH_WINDOW_YEARS` in `scripts/build-screening-data.mjs`. Call sites: the pipeline's `employmentGrowthPct`, `LQBubbleChart`, `CompareBubbleChart`, `NarrativeSummary`, and `TrendSummaryTable`. The pipeline also emits `growthStartDate` / `growthEndDate` so the window is auditable. When the matched month is unavailable the helpers return `null` rather than silently falling back to a mismatched month.
- The BLS restructured DC metro divisions from 2 to 3 in July 2023. Historical comparisons for the DC-MD and NoVA divisions before that date should be flagged as approximate.
- Some series may have footnotes indicating preliminary data (`(p)`). Show these indicators in the UI.

---

## Context: How This Tool Gets Used

These are peers, not a hierarchy. The same three questions — what does this metro
export, how concentrated is it, and which way is it moving — serve all of them.

### Economic Development & Site Selection
- Compare candidate markets for corporate relocations
- Identify competitive advantages of a region
- Support grant applications with economic base data
- Screen markets: "show me all MSAs where Professional & Business Services LQ > 1.3 and growing"

### Businesses Weighing a Move
- Check whether a metro has the labour base a given operation needs
- Spot markets where an industry is over- or under-served relative to the nation

### Investors & Analysts
- Understand the economic base driving demand in a market before committing
- Assess risk: identify single-industry dependency (e.g., DC and government, Houston and energy)
- Track trends: monitor whether a market's export base is growing or shrinking

### Public Policy & Planning
- Quantify exposure to a single employer or sector
- Track whether diversification efforts are moving the base

### Students & Researchers
- Learn economic base theory with real, interactive data
- Run location quotient analysis without building their own spreadsheets

### Journalists & Residents
- Answer "what does this city actually do for a living?" with a citable source
- Compare a hometown against peers on the same measure

---

## Landing Page / Educational Content

The landing page should serve dual purposes: (1) funnel users into the tool, and (2) provide SEO-rich educational content.

### Landing Page Sections

1. **Hero:** Search bar front a