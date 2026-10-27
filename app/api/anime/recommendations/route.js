import { NextResponse } from "next/server";
import { getPersonalizedRecommendations } from "@/utils/anilist";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const seedIds = Array.isArray(body?.seedIds) ? body.seedIds : [];
    const excludeIds = Array.isArray(body?.excludeIds) ? body.excludeIds : [];

    const data = await getPersonalizedRecommendations(seedIds, excludeIds);

    return NextResponse.json(
      {
        success: true,
        ...data,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (err) {
    console.error("API Recommendations POST Error:", err);
    return NextResponse.json(
      { success: false, error: err.message, seeds: [], combined: [] },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  try {
    const seedsParam = searchParams.get("seeds");
    const excludeParam = searchParams.get("exclude");

    const seedIds = seedsParam ? seedsParam.split(",").map(Number).filter(Boolean) : [];
    const excludeIds = excludeParam ? excludeParam.split(",").map(Number).filter(Boolean) : [];

    const data = await getPersonalizedRecommendations(seedIds, excludeIds);

    return NextResponse.json(
      {
        success: true,
        ...data,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (err) {
    console.error("API Recommendations GET Error:", err);
    return NextResponse.json(
      { success: false, error: err.message, seeds: [], combined: [] },
      { status: 500 }
    );
  }
}
