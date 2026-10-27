import { NextResponse } from "next/server";
import { getCategoryAnime } from "@/utils/anilist";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "trending";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "21", 10);
    const genre = searchParams.get("genre") || null;
    const sort = searchParams.get("sort") || null;

    const data = await getCategoryAnime({
      category,
      page,
      perPage,
      genre,
      sort,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Category API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category anime", media: [], pageInfo: { hasNextPage: false } },
      { status: 500 }
    );
  }
}
