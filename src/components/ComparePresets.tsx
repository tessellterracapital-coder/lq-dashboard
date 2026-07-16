"use client";

// Canonical slugs, matching public/data/lq_all_metros.json. These were all
// legacy slugs from the retired METROS list; they still resolved via the
// legacyMetroSlugs redirect table, but that table is a transitional shim that
// should not be depended on — every preset would have broken at once when it
// is eventually pruned.
const PRESETS = [
  {
    // Worth knowing when reading this one: CES counts public-university staff
    // under Government, not Education & Health Services. So the campus shows up
    // as Government LQ (Ann Arbor 2.60, Madison 1.53, Durham 1.36), and
    // Education & Health only lifts where the university is private — Durham has
    // both, Duke landing in Education & Health (1.33) and UNC in Government.
    label: "College Towns",
    desc: "Madison vs Ann Arbor vs Durham",
    params:
      "m1=madison-wi&m2=ann-arbor-mi&m3=durham-chapel-hill-nc",
  },
  {
    label: "Mountain West",
    desc: "Denver vs Salt Lake vs Boise",
    params:
      "m1=denver-aurora-centennial-co&m2=salt-lake-city-murray-ut&m3=boise-city-id",
  },
  {
    // Ordered by how far each has moved from manufacturing, which the table
    // reads straight off: Milwaukee still leads on Manufacturing (LQ 1.61),
    // Cleveland is mid-transition (1.43, with Education & Health at 1.11), and
    // Pittsburgh has finished — Manufacturing is 0.92, below the national mix,
    // while Education & Health at 1.29 (+61,195 jobs) is now its export base.
    label: "Rust Belt Reinvention",
    desc: "Milwaukee vs Cleveland vs Pittsburgh",
    params:
      "m1=milwaukee-waukesha-wi&m2=cleveland-oh&m3=pittsburgh-pa",
  },
  {
    // All three are top-10 for 10-year employment growth among the 71 metros
    // over 400K jobs: Austin #1 (42.3%), Nashville #4 (26.8%), Las Vegas #8
    // (25.0%).
    label: "Boom Towns",
    desc: "Las Vegas vs Nashville vs Austin",
    params:
      "m1=las-vegas-henderson-north-las-vegas-nv&m2=nashville-davidson-murfreesboro-franklin-tn&m3=austin-round-rock-san-marcos-tx",
  },
  {
    label: "West Coast Giants",
    desc: "LA vs SF vs Seattle",
    params:
      "m1=los-angeles-long-beach-anaheim-ca&m2=san-francisco-oakland-fremont-ca&m3=seattle-tacoma-bellevue-wa",
  },
  {
    label: "Florida Markets",
    desc: "Miami vs Orlando vs Tampa",
    params:
      "m1=miami-fort-lauderdale-west-palm-beach-fl&m2=orlando-kissimmee-sanford-fl&m3=tampa-st-petersburg-clearwater-fl",
  },
];

export default function ComparePresets() {
  return (
    <div className="bg-[#1a1d27] rounded-lg p-5 border border-gray-800">
      <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">Quick Comparisons</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {PRESETS.map((preset) => (
          <a
            key={preset.label}
            href={`/compare?${preset.params}`}
            className="px-3 py-2.5 rounded border border-gray-800 hover:border-blue-800 hover:bg-[#252836] transition-colors group"
          >
            <div className="text-sm font-medium text-gray-200 group-hover:text-blue-400 transition-colors">
              {preset.label}
            </div>
            <div className="text-xs text-gray-500">{preset.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
