"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { type Metro } from "@/data/metros";

interface MetroSelectorProps {
  onSelect: (metro: Metro) => void;
  selected?: Metro | null;
  /** Required: pass the full list from loadScreeningData(). There is no
   *  built-in fallback — a default list is how the search silently shrank to
   *  ~33 metros and hid Kansas City. */
  metros: Metro[];
}

export default function MetroSelector({ onSelect, selected, metros: source }: MetroSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return source;
    const q = query.toLowerCase();
    return source.filter((m) => m.name.toLowerCase().includes(q));
  }, [query, source]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg">
      <input
        type="text"
        placeholder="Search metro areas..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full px-4 py-3 bg-[#1a1d27] border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      {selected && !open && (
        <div className="mt-2 text-sm text-gray-400">
          Selected: <span className="text-blue-400">{selected.name}</span>
        </div>
      )}
      {open && (
        <ul className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-[#1a1d27] border border-gray-700 rounded-lg shadow-xl">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-gray-500">No metros found</li>
          ) : (
            filtered.map((metro) => (
              <li
                key={metro.slug}
                onClick={() => {
                  onSelect(metro);
                  setQuery("");
                  setOpen(false);
                }}
                className={`px-4 py-3 cursor-pointer hover:bg-[#252836] transition-colors ${
                  selected?.slug === metro.slug ? "bg-[#252836] text-blue-400" : "text-gray-300"
                }`}
              >
                {metro.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
