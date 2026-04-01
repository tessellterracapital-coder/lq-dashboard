"use client";

const PRESETS = [
  {
    label: "DC vs NoVA",
    desc: "Government vs. private-sector economy",
    params: "m1=washington-dc-md&m2=arlington-nova",
  },
  {
    label: "Sun Belt Tech Hubs",
    desc: "Austin vs Raleigh vs Nashville",
    params: "m1=austin-tx&m2=raleigh-nc&m3=nashville-tn",
  },
  {
    label: "Texas Triangle",
    desc: "Houston vs Dallas vs Austin",
    params: "m1=houston-tx&m2=dallas-tx&m3=austin-tx",
  },
  {
    label: "Great Lakes",
    desc: "Chicago vs Detroit vs Minneapolis",
    params: "m1=chicago-il&m2=detroit-mi&m3=minneapolis-mn",
  },
  {
    label: "West Coast Giants",
    desc: "LA vs SF vs Seattle",
    params: "m1=los-angeles-ca&m2=san-francisco-ca&m3=seattle-wa",
  },
  {
    label: "Florida Markets",
    desc: "Miami vs Orlando vs Tampa",
    params: "m1=miami-fl&m2=orlando-fl&m3=tampa-fl",
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
