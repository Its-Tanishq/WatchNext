import { NextResponse } from "next/server";
import {
  getTrendingAnime,
  getSeasonalAnime,
  getTopRatedAnime,
  getUpcomingAnime,
  getAiringSchedule,
  getCurrentSeason,
} from "@/utils/anilist";

export async function GET() {
  try {
    const { season, year } = getCurrentSeason();

    // Fetch all home data in parallel for blazing-fast response
    const [trending, seasonalData, topRated, upcoming, schedule] = await Promise.all([
      getTrendingAnime(1, 14),
      getSeasonalAnime(season, year, 1, 14),
      getTopRatedAnime(1, 14),
      getUpcomingAnime(1, 14),
      getAiringSchedule(0, 8),
    ]);

    return NextResponse.json({
      season,
      seasonYear: year,
      trending,
      seasonal: seasonalData?.list || [],
      topRated,
      upcoming,
      schedule,
    });
  } catch (error) {
    console.error("Home Anime API Error:", error);
    return NextResponse.json(
      { error: "Failed to load home anime data", trending: [], seasonal: [], topRated: [], upcoming: [], schedule: [] },
      { status: 500 }
    );
  }
}
