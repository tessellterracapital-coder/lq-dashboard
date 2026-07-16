"use client";

// Canonical slugs, matching public/data/lq_all_metros.json. These were all
// legacy slugs from the retired METROS list; they still resolved via the
// legacyMetroSlugs redirect table, but that table is a transitional shim that
// should not be depended on — every preset would have broken at once when it
// is eventually pruned.
const PRESETS = [
  {
    // Three metros, three different dominant sectors, all far above the national
    // mix — the clearest demonstration of what an LQ actually measures. San Jose
    // is the most concentrated large metro in the dataset.
    label: "Specialized Economies",
    desc: "San Jose vs Las Vegas vs Des Moines",
    params:
      "m1=san-jose-sunnyvale-santa-clara-ca&m2=las-vegas-henderson-north-las-vegas-nv&m3=des-moines-west-des-moines-ia",
  },
  {
    label: "Sun Belt Tech Hubs",
    desc: "Austin vs Raleigh vs Nashville",
    params:
      "m1=austin-round-rock-san-marcos-tx&m2=raleigh-cary-nc&m3=nashville-davidson-murfreesboro-franklin-tn",
  },
  {
    label: "Texas Triangle",
    desc: "Houston vs Dallas vs Austin",
    params:
      "m1=houston-pasadena-the-woodlands-tx&m2=dallas-fort-worth-arlington-tx&m3=austin-round-rock-san-marcos-tx",
  },
  {
    // Cleveland, not Minneapolis: the Twin Cities sit on the Mississippi, not
    // the lakes. All three of these are lakefront.
    label: "Great Lakes",
    desc: "Chicago vs Detroit vs Cleveland",
    params:
      "m1=chicago-naperville-elgin-il-in&m2=detroit-warren-dearborn-mi&m3=cleveland-oh",
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
