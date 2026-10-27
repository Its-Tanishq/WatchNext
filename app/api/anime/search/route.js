import { NextResponse } from "next/server";
import { searchAnime } from "@/utils/anilist";

// High-speed In-Memory Cache for Instant Search Responses
const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes
const MAX_CACHE_SIZE = 250;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const genre = searchParams.get("genre") || null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "6", 10);

    if (!q && !genre) {
      return NextResponse.json({ results: [] });
    }

    const cacheKey = `${q}:${genre || ""}:${page}:${perPage}`;

    // Return instant cached results if available and valid
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json({ results: cached.data, cached: true });
      }
      searchCache.delete(cacheKey);
    }

    const results = await searchAnime(q, page, perPage, genre);

    // Save in cache (manage cache size)
    if (searchCache.size > MAX_CACHE_SIZE) {
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }
    searchCache.set(cacheKey, { timestamp: Date.now(), data: results });

    return NextResponse.json({ results, cached: false });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Failed to search anime", results: [] }, { status: 500 });
  }
}
