import { NextRequest, NextResponse } from "next/server";

const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";
const BLS_API_KEY = "b91db61638054b0397caa7209d528425";

// Server-side in-memory cache: key -> { data, timestamp }
// Entries expire after 6 hours (BLS data updates monthly, so this is very safe)
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function buildCacheKey(seriesids: string[], startyear: string, endyear: string): string {
  // Sort series IDs so the same set in different order hits the same cache entry
  const sorted = [...seriesids].sort();
  return `${sorted.join(",")}|${startyear}|${endyear}`;
}

function pruneStaleEntries() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const seriesids: string[] = body.seriesid ?? [];
  const startyear: string = body.startyear ?? "";
  const endyear: string = body.endyear ?? "";

  // Check cache
  const cacheKey = buildCacheKey(seriesids, startyear, endyear);
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  // Cache miss — call BLS API
  const response = await fetch(BLS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      seriesid: seriesids,
      startyear,
      endyear,
      registrationkey: BLS_API_KEY,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `BLS API error: ${response.status}` },
      { status: response.status }
    );
  }

  const data = await response.json();

  // Only cache successful responses
  if (data.status === "REQUEST_SUCCEEDED") {
    cache.set(cacheKey, { data, timestamp: Date.now() });

    // Periodically prune stale entries to prevent unbounded growth
    if (cache.size > 200) {
      pruneStaleEntries();
    }
  }

  return NextResponse.json(data);
}
