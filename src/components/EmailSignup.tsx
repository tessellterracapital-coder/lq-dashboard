"use client";

import { useState } from "react";

export default function EmailSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // Placeholder — store in localStorage until a real backend is connected
    try {
      const existing = JSON.parse(localStorage.getItem("metrolq-email-signups") ?? "[]");
      existing.push({ email, date: new Date().toISOString() });
      localStorage.setItem("metrolq-email-signups", JSON.stringify(existing));
    } catch {}
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-[#1a1d27] rounded-lg p-5 border border-gray-800 text-center">
        <div className="text-green-400 font-medium text-sm">Thanks! We&apos;ll notify you when new data is available.</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1d27] rounded-lg p-5 border border-gray-800">
      <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Data Alerts</div>
      <p className="text-sm text-gray-400 mb-3">
        Get notified when BLS releases new employment data for your saved metros.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 bg-[#0f1117] border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors"
        >
          Notify Me
        </button>
      </form>
    </div>
  );
}
