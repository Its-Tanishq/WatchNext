import { NextResponse } from "next/server";
import { getAnimeById } from "@/utils/anilist";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Anime ID is required" }, { status: 400 });
    }

    const anime = await getAnimeById(id);
    if (!anime) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    return NextResponse.json({ anime });
  } catch (error) {
    console.error("Anime Details API Error:", error);
    return NextResponse.json({ error: "Failed to fetch anime details" }, { status: 500 });
  }
}
