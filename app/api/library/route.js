import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/library - Fetch authenticated user's library
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_anime_library")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ library: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/library - Upsert single anime or bulk operations
export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, anime, updates, entryIds } = body;

    // Bulk delete action
    if (action === "bulk_delete" && Array.isArray(entryIds)) {
      const { error } = await supabase
        .from("user_anime_library")
        .delete()
        .in("id", entryIds)
        .eq("user_id", user.id);

      if (error) throw error;
      return NextResponse.json({ success: true, count: entryIds.length });
    }

    // Bulk update action
    if (action === "bulk_update" && Array.isArray(entryIds) && updates) {
      const payload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("user_anime_library")
        .update(payload)
        .in("id", entryIds)
        .eq("user_id", user.id)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, count: data?.length || 0, data });
    }

    // Standard single anime upsert
    if (anime && updates) {
      const animeId = Number(anime.id || anime.anime_id);
      const row = {
        user_id: user.id,
        anime_id: animeId,
        anime_title: anime.title?.english || anime.title?.romaji || anime.anime_title || "Unknown Anime",
        anime_title_romaji: anime.title?.romaji || anime.anime_title_romaji || null,
        anime_title_english: anime.title?.english || anime.anime_title_english || null,
        anime_title_native: anime.title?.native || anime.anime_title_native || null,
        anime_cover: anime.coverImage?.extraLarge || anime.coverImage?.large || anime.anime_cover || null,
        anime_banner: anime.bannerImage || anime.anime_banner || null,
        anime_format: anime.format || anime.anime_format || "TV",
        anime_genres: anime.genres || anime.anime_genres || [],
        anime_total_episodes: anime.episodes ?? anime.anime_total_episodes ?? null,
        anime_season: anime.season ?? anime.anime_season ?? null,
        anime_season_year: anime.seasonYear ?? anime.anime_season_year ?? null,
        anime_average_score: anime.averageScore ?? anime.anime_average_score ?? null,
        status: updates.status || "PLANNING",
        is_favourite: updates.is_favourite ?? false,
        episodes_watched: Math.max(0, Number(updates.episodes_watched || 0)),
        rewatch_counter: Math.max(0, Number(updates.rewatch_counter || 0)),
        user_score: updates.user_score !== undefined && updates.user_score !== "" ? Number(updates.user_score) : null,
        user_notes: updates.user_notes ?? "",
        custom_lists: Array.isArray(updates.custom_lists) ? updates.custom_lists : [],
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("user_anime_library")
        .upsert(row, { onConflict: "user_id,anime_id" })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
