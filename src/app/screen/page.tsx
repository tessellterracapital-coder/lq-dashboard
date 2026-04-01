"use client";

import { useState, useEffect, useMemo } from "react";
import { loadScreeningData, type ScreeningData } from "@/lib/screeningData";
import ScreeningFilters, { type FilterState, getDefaultFilters } from "@/components/ScreeningFilters";
import ScreeningTable from "@/components/ScreeningTable";

export default function ScreenPage() {
  const [data, setData] = useState<ScreeningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(getDefaultFilters);

  useEffect(() => {
    loadScreeningData()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];

    return data.metros.filter((metro) => {
      // Area type
      if (filters.areaType !== "all") {
        if (metro.areaType !== filters.areaType) return false;
      }

      // Name search
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!metro.name.toLowerCase().includes(q)) return false;
      }

      // Employment size
      if (filters.minEmployment) {
        if (metro.totalEmployment < parseFloat(filters.minEmployment)) return false;
      }
      if (filters.maxEmployment) {
        if (metro.totalEmployment > parseFloat(filters.maxEmployment)) return false;
      }

      // Employment growth
      if (filters.minGrowth) {
        if (metro.employmentGrowthPct === null || metro.employmentGrowthPct < parseFloat(filters.minGrowth)) return false;
      }
      if (filters.maxGrowth) {
        if (metro.employmentGrowthPct === null || metro.employmentGrowthPct > parseFloat(filters.maxGrowth)) return false;
      }

      // Concentration threshold
      if (filters.maxConcentration) {
        if (metro.largestSectorPct > parseFloat(filters.maxConcentration)) return false;
      }

      // Sector LQ filters
      for (const [code, sf] of Object.entries(filters.sectorFilters)) {
        if (!sf.minLQ && !sf.maxLQ) continue;

        const lq = metro.lq[code];
        // If metro doesn't have data for this sector and we're filtering on it, exclude
        if (lq === undefined) return false;

        if (sf.minLQ && lq < parseFloat(sf.minLQ)) return false;
        if (sf.maxLQ && lq > parseFloat(sf.maxLQ)) return false;
      }

      return true;
    });
  }, [data, filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Filter Metros</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search across {data?.metroCount ?? "400+"} U.S. metro areas to find markets matching
          your investment criteria.
          {data && (
            <span className="text-gray-600">
              {" "}Data: {data.nationalDataPeriod}
            </span>
          )}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-3 text-gray-400">Loading screening data...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Content */}
      {data && (
        <>
          <ScreeningFilters
            filters={filters}
            onChange={setFilters}
            metroCount={data.metroCount}
            filteredCount={filtered.length}
          />

          <div>
            <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-3">
              Results
            </h2>
            <ScreeningTable metros={filtered} />
          </div>
        </>
      )}
    </div>
  );
}
