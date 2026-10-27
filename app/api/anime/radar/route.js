import { NextResponse } from "next/server";
import { getUpcomingRadarForAnimeList } from "@/utils/anilist";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const animeIds = Array.isArray(body?.animeIds) ? body.animeIds : [];

    if (animeIds.length === 0) {
      return NextResponse.json({ success: true, radar: [], count: 0 });
    }

    const radar = await getUpcomingRadarForAnimeList(animeIds);

    return NextResponse.json(
      {
        success: true,
        radar,
        count: radar.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (err) {
    console.error("API Radar Error:", err);
    return NextResponse.json({ success: false, error: err.message, radar: [], count: 0 }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  try {
    const idsParam = searchParams.get("ids");
    const animeIds = idsParam ? idsParam.split(",").map(Number).filter(Boolean) : [];

    if (animeIds.length === 0) {
      return NextResponse.json({ success: true, radar: [], count: 0 });
    }

    const radar = await getUpcomingRadarForAnimeList(animeIds);
    return NextResponse.json(
      { success: true, radar, count: radar.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (err) {
    console.error("API Radar GET Error:", err);
    return NextResponse.json({ success: false, error: err.message, radar: [], count: 0 }, { status: 500 });
  }
}
