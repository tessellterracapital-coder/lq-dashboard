import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Location Quotients & Economic Base Analysis | MetroLQ",
  description:
    "Learn about location quotient analysis, export base theory, the employment multiplier effect, and how BLS data is used to assess metro-area economies.",
};

export default function AboutPage() {
  return (
    <article className="max-w-3xl mx-auto space-y-12 py-4">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-4">
          Understanding Economic Base Analysis
        </h1>
        <p className="text-lg text-gray-400">
          A comprehensive guide to location quotients, export base theory, and how to use
          employment data for market analysis.
        </p>
      </header>

      {/* Economic Base Theory */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-100">What is Economic Base Theory?</h2>
        <div className="space-y-4 text-gray-400 leading-relaxed">
          <p>
            Economic base theory divides a regional economy into two parts:
            the <strong className="text-gray-200">basic (export) sector</strong> and
            the <strong className="text-gray-200">non-basic (local) sector</strong>.
          </p>
          <p>
            The basic sector produces goods and services that are sold outside the region,
            bringing new money in. The non-basic sector serves local demand &mdash; restaurants,
            healthcare, retail, local government services. The key insight is that the basic
            sector is the engine: it determines the overall size and growth trajectory of
            the regional economy.
          </p>
          <p>
            When an export sector grows, it creates direct jobs &mdash; but it also creates
            indirect jobs as those workers spend their income locally. When an export sector
            shrinks, the reverse happens: layoffs ripple through the local economy via reduced
            spending.
          </p>
        </div>
      </section>

      {/* Location Quotients */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-100">What is a Location Quotient?</h2>
        <div className="space-y-4 text-gray-400 leading-relaxed">
          <p>
            A Location Quotient (LQ) is the standard tool for identifying basic vs. non-basic
            sectors. It compares the share of employment in a given industry in a local area to
            the same share nationally:
          </p>
          <div className="bg-[#1a1d27] border border-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300">
            LQ = (Local industry employment / Total local employment) / (National industry employment / Total national employment)
          </div>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>
              <strong className="text-gray-200">LQ &gt; 1.0</strong> &mdash; Export sector. The
              area is more concentrated than the national average, meaning it produces more than
              local demand requires. The surplus is &quot;exported.&quot;
            </li>
            <li>
              <strong className="text-gray-200">LQ &asymp; 1.0</strong> &mdash; Local sector.
              Matches national proportions; primarily serves the local population.
            </li>
            <li>
              <strong className="text-gray-200">LQ &lt; 1.0</strong> &mdash; Import sector.
              The area is underrepresented and effectively imports this activity from elsewhere.
            </li>
          </ul>
          <p>
            This tool uses a threshold of <strong className="text-gray-200">LQ &ge; 1.2</strong> to
            classify export sectors, providing a buffer to account for measurement noise and
            seasonal variation.
          </p>
        </div>
      </section>

      {/* Multiplier Effect */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-100">The Employment Multiplier Effect</h2>
        <div className="space-y-4 text-gray-400 leading-relaxed">
          <p>
            Each export-sector job typically supports between 1.5 and 3 additional local-sector
            jobs. The exact multiplier depends on the industry, wage levels, and local spending
            patterns.
          </p>
          <p>
            High-wage export sectors (like Professional &amp; Business Services or Information
            Technology) tend to have higher multipliers because workers have more disposable
            income to spend locally. Lower-wage export sectors still generate multiplier effects,
            but smaller ones.
          </p>
          <p>
            This is why economic development organizations focus on attracting and retaining
            export-sector employers: one new corporate headquarters doesn&apos;t just mean the
            jobs at that company; it means the restaurants, childcare centers, housing, and
            retail that follow.
          </p>
        </div>
      </section>

      {/* Applications */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-100">What It Tells You</h2>
        <div className="space-y-4 text-gray-400 leading-relaxed">
          <p>
            A metro&apos;s economic base answers questions that matter to anyone
            weighing up a region &mdash; whether you are siting or expanding a business,
            evaluating a market, shaping local policy, doing research, or working out
            where to build a career:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>
              <strong className="text-gray-200">Demand drivers:</strong> What industries are
              bringing people (and money) into the region? Strong export sectors create
              employment growth, which drives population growth and local spending.
            </li>
            <li>
              <strong className="text-gray-200">Concentration risk:</strong> Is the metro
              dangerously dependent on a single sector? DC&apos;s dependence on Government,
              Houston&apos;s on Energy, Detroit&apos;s on Manufacturing &mdash; when that sector
              contracts, the entire local economy suffers.
            </li>
            <li>
              <strong className="text-gray-200">Diversification:</strong> Markets with multiple
              export sectors are more resilient to industry-specific downturns.
            </li>
            <li>
              <strong className="text-gray-200">Market screening:</strong> Use LQ data to
              identify metros matching whatever criteria you care about &mdash; e.g., growing
              healthcare markets, tech hubs, or diversified economies.
            </li>
          </ul>
        </div>
      </section>

      {/* BLS Data */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-100">About the Data</h2>
        <div className="space-y-4 text-gray-400 leading-relaxed">
          <p>
            This tool uses data from the Bureau of Labor Statistics (BLS)
            {" "}<strong className="text-gray-200">Current Employment Statistics (CES)</strong>{" "}
            survey. CES is a monthly survey of approximately 131,000 businesses and government
            agencies covering about 670,000 worksites, making it one of the most comprehensive
            employment data sources available.
          </p>
          <p>
            Employment figures are reported in thousands and are <strong className="text-gray-200">not
            seasonally adjusted</strong> (NSA). This means year-over-year comparisons are valid,
            but month-to-month changes include seasonal effects.
          </p>
          <p>
            Data is organized by <strong className="text-gray-200">supersector</strong> &mdash;
            10 broad industry categories that encompass all nonfarm employment. While supersectors
            provide a useful high-level view, they are intentionally broad. A metro with a high
            LQ in &quot;Professional &amp; Business Services&quot; could be driven by defense
            contractors, management consulting, or legal services &mdash; very different economic
            stories.
          </p>
        </div>
      </section>

      {/* Limitations */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-100">Limitations of LQ Analysis</h2>
        <div className="space-y-4 text-gray-400 leading-relaxed">
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>
              <strong className="text-gray-200">Broad categories:</strong> Supersectors group
              very different industries together. Sub-sector analysis would reveal more nuance.
            </li>
            <li>
              <strong className="text-gray-200">Remote work:</strong> LQ is based on where jobs
              are located, not where workers live. The rise of remote work means some
              &quot;export&quot; jobs may now be performed by workers living outside the metro.
            </li>
            <li>
              <strong className="text-gray-200">Job quality:</strong> LQ measures job counts,
              not wages. A high LQ in Leisure &amp; Hospitality means different things for local
              income than a high LQ in Financial Activities.
            </li>
            <li>
              <strong className="text-gray-200">Metro definitions:</strong> MSA boundaries are
              defined by the OMB and may not match the economic geography a local observer would
              draw. Metro divisions provide finer detail but aren&apos;t available everywhere.
            </li>
            <li>
              <strong className="text-gray-200">Snapshot in time:</strong> LQ reflects current
              structure, not trajectory. Always pair with trend data (available on each metro
              page) to see the direction of change.
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center pt-4 pb-8">
        <a
          href="/"
          className="inline-block px-6 py-3 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Start exploring metro economies &rarr;
        </a>
      </section>
    </article>
  );
}
