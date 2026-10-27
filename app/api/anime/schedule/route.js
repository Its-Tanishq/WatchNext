import { NextResponse } from "next/server";
import { getAiringSchedule } from "@/utils/anilist";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  try {
    const dayOffset = parseInt(searchParams.get("dayOffset") || "0", 10);
    const perPage = parseInt(searchParams.get("perPage") || "50", 10);

    const schedule = await getAiringSchedule(dayOffset, perPage);
    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Schedule API Error:", error);
    return NextResponse.json({ error: "Failed to fetch schedule", schedule: [] }, { status: 500 });
  }
}
