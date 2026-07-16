"use client";

import { SUPERSECTORS } from "@/data/supersectors";

export type AreaTypeFilter = "all" | "msa" | "division";

export interface FilterState {
  search: string;
  areaType: AreaTypeFilter;
  minEmployment: string;
  maxEmployment: string;
  minGrowth: string;
  maxGrowth: string;
  maxConcentration: string;
  sectorFilters: Record<string, { minLQ: string; maxLQ: string }>;
}

export function getDefaultFilters(): FilterState {
  return {
    search: "",
    areaType: "all",
    minEmployment: "",
    maxEmployment: "",
    minGrowth: "",
    maxGrowth: "",
    maxConcentration: "",
    sectorFilters: {},
  };
}

interface ScreeningFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  metroCount: number;
  filteredCount: number;
}

export default function ScreeningFilters({
  filters,
  onChange,
  metroCount,
  filteredCount,
}: ScreeningFiltersProps) {
  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  function updateSector(code: string, field: "minLQ" | "maxLQ", value: string) {
    onChange({
      ...filters,
      sectorFilters: {
        ...filters.sectorFilters,
        [code]: {
          minLQ: filters.sectorFilters[code]?.minLQ ?? "",
          maxLQ: filters.sectorFilters[code]?.maxLQ ?? "",
          [field]: value,
        },
      },
    });
  }

  function clearAll() {
    onChange(getDefaultFilters());
  }

  const hasActiveFilters =
    filters.search ||
    filters.areaType !== "all" ||
    filters.minEmployment ||
    filters.maxEmployment ||
    filters.minGrowth ||
    filters.maxGrowth ||
    filters.maxConcentration ||
    Object.values(filters.sectorFilters).some((f) => f.minLQ || f.maxLQ);

  return (
    <div className="bg-[#1a1d27] rounded-lg border border-gray-800 p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider text-gray-500">Filters</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {filteredCount} of {metroCount} metros
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Area type toggle */}
      <div>
        <label className="text-xs text-gray-500 block mb-2">Geography level</label>
        <div className="flex items-center gap-1 bg-[#0f1117] border border-gray-700 rounded-lg p-1 w-fit">
          {([
            { value: "all", label: "All" },
            { value: "msa", label: "MSAs Only" },
            { value: "division", label: "Divisions Only" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ areaType: opt.value })}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filters.areaType === opt.value
                  ? "bg-[#252836] text-gray-100"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-1.5">
          MSAs are broad metro areas. Divisions are sub-areas within large MSAs. Compare like with like.
        </p>
      </div>

      {/* Search + employment size + growth + concentration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metro name — spans full width on mobile, 2 cols on lg */}
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="text-xs text-gray-500 block mb-1">Metro name</label>
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full px-3 py-2 bg-[#0f1117] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Employment range */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">Employment (K)</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="Min"
              value={filters.minEmployment}
              onChange={(e) => update({ minEmployment: e.target.value })}
              className="w-full px-2 py-2 bg-[#0f1117] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
            <span className="text-gray-600 text-xs shrink-0">—</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxEmployment}
              onChange={(e) => update({ maxEmployment: e.target.value })}
              className="w-full px-2 py-2 bg-[#0f1117] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Growth range */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">10Y growth (%)</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.1"
              placeholder="Min"
              value={filters.minGrowth}
              onChange={(e) => update({ minGrowth: e.target.value })}
              className="w-full px-2 py-2 bg-[#0f1117] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
            <span className="text-gray-600 text-xs shrink-0">—</span>
            <input
              type="number"
              step="0.1"
              placeholder="Max"
              value={filters.maxGrowth}
              onChange={(e) => update({ maxGrowth: e.target.value })}
              className="w-full px-2 py-2 bg-[#0f1117] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Max concentration — second row, aligned left */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="text-xs text-gray-500 block mb-1">Max concentration (%)</label>
          <input
            type="number"
            placeholder="e.g. 25"
            value={filters.maxConcentration}
            onChange={(e) => update({ maxConcentration: e.target.value })}
            className="w-full px-3 py-2 bg-[#0f1117] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Sector LQ filters */}
      <div>
        <label className="text-xs text-gray-500 block mb-2">LQ range by sector</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SUPERSECTORS.map((sector) => {
            const sf = filters.sectorFilters[sector.code];
            const isActive = sf?.minLQ || sf?.maxLQ;
            return (
              <div
                key={sector.code}
                className={`flex items-center gap-2 px-3 py-2 rounded border ${
                  isActive ? "border-blue-800 bg-blue-900/10" : "border-gray-800"
                }`}
              >
                <span className="text-xs text-gray-400 w-28 shrink-0 truncate" title={sector.label}>
                  {sector.label.replace("Mining, Logging & Construction", "Mining/Constr.")
                    .replace("Trade, Transportation & Utilities", "Trade/Transport")
                    .replace("Professional & Business Services", "Prof. & Business")
                    .replace("Education & Health Services", "Edu. & Health")
                    .replace("Leisure & Hospitality", "Leisure/Hosp.")}
                </span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Min"
                  value={sf?.minLQ ?? ""}
                  onChange={(e) => updateSector(sector.code, "minLQ", e.target.value)}
                  className="w-16 px-2 py-1 bg-[#0f1117] border border-gray-700 rounded text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
                <span className="text-gray-600 text-xs">—</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Max"
                  value={sf?.maxLQ ?? ""}
                  onChange={(e) => updateSector(sector.code, "maxLQ", e.target.value)}
                  className="w-16 px-2 py-1 bg-[#0f1117] border border-gray-700 rounded text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
