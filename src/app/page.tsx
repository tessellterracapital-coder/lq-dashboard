"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MetroSelector from "@/components/MetroSelector";
import AdPlaceholder from "@/components/AdPlaceholder";
import ComparePresets from "@/components/ComparePresets";
import EmailSignup from "@/components/EmailSignup";
import { useFavorites } from "@/lib/useFavorites";
import { loadScreeningData } from "@/lib/screeningData";
import { type Metro } from "@/data/metros";

// Canonical slugs, matching public/data/lq_all_metros.json. These were legacy
// curated slugs; "new-york-ny" in particular resolved to Nassau County-Suffolk
// County data under the New York name.
const FEATURED = [
  { label: "Washington DC", slug: "washington-dc-md-metropolitan-division" },
  { label: "New York", slug: "new-york-newark-jersey-city-ny-nj" },
  { label: "Houston", slug: "houston-pasadena-the-woodlands-tx" },
  { label: "Los Angeles", slug: "los-angeles-long-beach-anaheim-ca" },
  { label: "Chicago", slug: "chicago-naperville-elgin-il-in" },
];

export default function Home() {
  const router = useRouter();
  const { favorites } = useFavorites();

  // All 431 metros, so search matches the "400+" promise above. The retired
  // METROS constant listed only ~33, which silently hid most of the country
  // (e.g. Kansas City never appeared).
  const [allMetros, setAllMetros] = useState<Metro[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadScreeningData()
      .then((d) => {
        if (cancelled) return;
        setAllMetros(
          d.metros.map((m) => ({
            stateCode: m.stateCode,
            areaCode: m.areaCode,
            name: m.name,
            slug: m.slug,
          }))
        );
      })
      .catch(() => {
        /* selector stays empty; the featured chips below still work */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelect(metro: Metro) {
    router.push(`/metro/${metro.slug}`);
  }

  const favoriteMetros = useMemo(
    () =>
      favorites
        .map((slug) => allMetros.find((m) => m.slug === slug))
        .filter((m): m is Metro => m !== undefined),
    [favorites, allMetros]
  );

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center pt-12 pb-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-100 mb-4">
          What drives your city&apos;s economy?
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          Free Location Quotient analysis for 400+ U.S. metro areas. Identify export sectors,
          assess concentration risk, compare markets, and screen for the criteria that
          matter to you &mdash;&nbsp;all powered by Bureau of Labor Statistics employment data.
        </p>
        <div className="flex justify-center">
          <MetroSelector onSelect={handleSelect} metros={allMetros} />
        </div>

        {/* Favorites or featured chips */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {favoriteMetros.length > 0 ? (
            <>
              <span className="text-xs text-gray-600 self-center mr-1">Your metros:</span>
              {favoriteMetros.map((m) => (
                <a
                  key={m.slug}
                  href={`/metro/${m.slug}`}
                  className="px-3 py-1.5 text-sm bg-[#1a1d27] border border-yellow-800/50 rounded-full text-yellow-400/80 hover:text-yellow-400 hover:border-yellow-700 transition-colors"
                >
                  {m.name.split(",")[0].split("-")[0].trim()}
                </a>
              ))}
            </>
          ) : (
            FEATURED.map((f) => (
              <a
                key={f.slug}
                href={`/metro/${f.slug}`}
                className="px-3 py-1.5 text-sm bg-[#1a1d27] border border-gray-800 rounded-full text-gray-400 hover:text-blue-400 hover:border-blue-800 transition-colors"
              >
                {f.label}
              </a>
            ))
          )}
        </div>
      </section>

      {/* Leaderboard ad */}
      <div className="hidden sm:block">
        <AdPlaceholder format="leaderboard" />
      </div>
      <div className="sm:hidden">
        <AdPlaceholder format="banner" />
      </div>

      {/* What is a Location Quotient? */}
      <section className="max-w-3xl mx-auto" id="what-is-lq">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">What is a Location Quotient?</h2>
        <div className="space-y-5 text-gray-400 leading-relaxed">
          <p>
            A Location Quotient (LQ) measures how concentrated a local area is in a given
            industry relative to the national average. An LQ greater than 1.0 identifies an
            &quot;export&quot; industry &mdash; one that produces more than the local population
            needs. The surplus is effectively exported to the rest of the world, bringing outside
            money into the region.
          </p>

          <div className="bg-[#1a1d27] border border-gray-800 rounded-lg p-5">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Formula</div>
            <div className="font-mono text-sm text-gray-300">
              LQ = (Local industry employment / Total local employment) / (National industry employment / Total national employment)
            </div>
          </div>

          <p>
            That income circulates through the local economy as workers spend on housing,
            restaurants, childcare, and other services, creating additional jobs. This is
            the <strong className="text-gray-200">multiplier effect</strong> &mdash; each
            export-sector job typically supports 1.5&ndash;3 additional service-sector jobs.
            The higher the LQ, the more concentrated &mdash; and more dependent &mdash; the
            local economy is on that industry.
          </p>

          {/* Worked example */}
          <div className="bg-[#1a1d27] border border-gray-800 rounded-lg p-5 space-y-3">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Worked Example &mdash; Des Moines, IA</div>
            <div className="text-sm text-gray-300 space-y-2">
              <p>
                <span className="font-mono text-blue-400">13.5%</span> of Des Moines jobs are
                in Financial Activities, against <span className="font-mono text-gray-200">5.7%</span>{" "}
                of U.S. jobs:
              </p>
              <div className="font-mono text-gray-200 pl-4">
                LQ = 13.5% / 5.7% &asymp; <span className="text-blue-400 font-bold">2.36</span>
              </div>
              <p>
                An LQ of 2.36 means Des Moines is more than twice as concentrated in Financial
                Activities as the nation &mdash; the insurance and financial services base the
                metro is known for. That concentration is a strong export sector, bringing
                outside money in, but it is also the metro&apos;s single largest dependency: if
                it contracts, the multiplier effect runs in reverse.
              </p>
            </div>
          </div>

          <p>
            <strong className="text-gray-200">Why it matters:</strong> High-LQ sectors
            drive a metro&apos;s employment, population growth, and income. But
            concentration in a single export sector creates risk &mdash; if that sector
            contracts, the multiplier effect works in reverse. A metro&apos;s economic
            base is the starting point for anyone sizing up a regional economy &mdash;
            siting a business, evaluating a market, shaping policy, or deciding where to
            build a career.
          </p>
        </div>
      </section>

      {/* Visual preview — link to the worked example above */}
      <section className="max-w-3xl mx-auto">
        <a
          href="/metro/des-moines-west-des-moines-ia"
          className="block bg-[#1a1d27] border border-gray-800 rounded-lg p-6 hover:border-blue-800 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500">Example Analysis</div>
              <div className="text-lg font-semibold text-gray-100 mt-1 group-hover:text-blue-400 transition-colors">
                Des Moines-West Des Moines, IA
              </div>
            </div>
            <span className="text-gray-600 group-hover:text-blue-400 transition-colors">&rarr;</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Top Export</div>
              <div className="text-blue-400 font-semibold">Financial Activities</div>
            </div>
            <div>
              <div className="text-gray-500">Top LQ</div>
              <div className="font-mono font-bold text-gray-100">2.36</div>
            </div>
            <div>
              <div className="text-gray-500">Export Sectors</div>
              <div className="font-mono font-bold text-gray-100">3</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">
            Click to see the full LQ bar chart, data table, and 10-year trends &rarr;
          </p>
        </a>
      </section>

      {/* Compare presets */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Compare Markets</h2>
        <ComparePresets />
      </section>

      {/* How to use this tool */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">How to Use This Tool</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              step: "1",
              title: "Search a metro",
              desc: "Use the search bar to find any of 400+ U.S. metro areas by name.",
            },
            {
              step: "2",
              title: "Read the LQ chart",
              desc: "Blue bubbles (LQ > 1.0) are export sectors — they produce more than the metro consumes. The gold line marks 1.0. Red indicates import sectors.",
            },
            {
              step: "3",
              title: "Compare metros",
              desc: "Select 2\u20133 metros on the Compare page to see their economic profiles side by side.",
            },
            {
              step: "4",
              title: "Filter for criteria",
              desc: "Use the Filter page to narrow 400+ metros by LQ range, employment size, and concentration.",
            },
          ].map((item) => (
            <div key={item.step} className="bg-[#1a1d27] border border-gray-800 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-7 rounded-full bg-blue-900/40 text-blue-400 text-sm font-bold flex items-center justify-center">
                  {item.step}
                </span>
                <span className="font-semibold text-gray-200">{item.title}</span>
              </div>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Email signup + Mobile rectangle ad */}
      <section className="max-w-3xl mx-auto">
        <EmailSignup />
      </section>

      <div className="sm:hidden">
        <AdPlaceholder format="rectangle" />
      </div>

      {/* About / educational footer CTA */}
      <section className="max-w-3xl mx-auto text-center pb-4">
        <p className="text-gray-500 text-sm">
          Want to learn more about economic base theory, export base analysis, and the
          multiplier effect?
        </p>
        <a
          href="/about"
          className="inline-block mt-3 px-5 py-2 text-sm border border-gray-700 rounded-lg text-gray-300 hover:text-blue-400 hover:border-blue-800 transition-colors"
        >
          Read the full guide &rarr;
        </a>
      </section>
    </div>
  );
}
