"use client";

import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-[#0f1117]/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <a href="/" className="text-lg font-bold tracking-tight text-gray-100">
          Metro<span className="text-blue-500">LQ</span>
        </a>
        <div className="flex items-center gap-6">
          <nav className="flex gap-6 text-sm text-gray-400">
            <a href="/" className="hover:text-gray-200 transition-colors">Dashboard</a>
            <a href="/compare" className="hover:text-gray-200 transition-colors">Compare</a>
            <a href="/screen" className="hover:text-gray-200 transition-colors">Filter</a>
            <a href="/about" className="hover:text-gray-200 transition-colors">About</a>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
