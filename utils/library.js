// ==============================================================================
// WATCHNEXT - PERSONAL ANIME LIBRARY UTILITIES & SUPABASE DATA ACCESS
// ==============================================================================

export const LIBRARY_STATUSES = [
  { id: "ALL", label: "All Library", icon: "📚" },
  { id: "CURRENT", label: "Currently Watching", shortLabel: "Watching", icon: "▶️", color: "#10b981", bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { id: "COMPLETED", label: "Completed", shortLabel: "Completed", icon: "✅", color: "#3b82f6", bg: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { id: "PLANNING", label: "Plan to Watch", shortLabel: "Plan to Watch", icon: "🗓️", color: "#8b5cf6", bg: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { id: "PAUSED", label: "On Hold", shortLabel: "On Hold", icon: "⏸️", color: "#f59e0b", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { id: "DROPPED", label: "Dropped", shortLabel: "Dropped", icon: "⏹️", color: "#ef4444", bg: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
];

export const STATUS_MAP = LIBRARY_STATUSES.reduce((acc, curr) => {
  if (curr.id !== "ALL") acc[curr.id] = curr;
  return acc;
}, {});

/**
 * Fetch the complete personal anime library for the authenticated user.
 */
export async function fetchUserLibrary(supabase) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: [], user: null, error: userError || new Error("User not authenticated") };
    }

    const { data, error } = await supabase
      .from("user_anime_library")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return { data: [], user, error };
    }

    return { data: data || [], user, error: null };
  } catch (err) {
    return { data: [], user: null, error: err };
  }
}

/**
 * Fetch user custom lists metadata
 */
export async function fetchUserCustomLists(supabase) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return { data: [], error: userError };

    const { data, error } = await supabase
      .from("user_custom_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    return { data: data || [], error };
  } catch (err) {
    return { data: [], error: err };
  }
}

/**
 * Fetch an individual anime entry from the user's library
 */
export async function fetchSingleLibraryEntry(supabase, animeId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from("user_anime_library")
      .select("*")
      .eq("user_id", user.id)
      .eq("anime_id", Number(animeId))
      .maybeSingle();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Upsert or save an anime into the user's library
 */
export async function upsertAnimeToLibrary(supabase, anime, updates = {}) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Please sign in to save anime to your personal library.");

    const animeId = Number(anime.id);
    const title = typeof anime.title === "object"
      ? (anime.title.english || anime.title.romaji || anime.title.native || "Unknown Anime")
      : (anime.anime_title || anime.title || "Unknown Anime");

    const cover = anime.coverImage?.extraLarge || anime.coverImage?.large || anime.anime_cover || null;
    const banner = anime.bannerImage || anime.anime_banner || cover;
    const totalEpisodes = anime.episodes ?? anime.anime_total_episodes ?? null;
    const genres = anime.genres ?? anime.anime_genres ?? [];
    const format = anime.format ?? anime.anime_format ?? "TV";
    const avgScore = anime.averageScore ?? anime.anime_average_score ?? null;

    const row = {
      user_id: user.id,
      anime_id: animeId,
      anime_title: title,
      anime_title_romaji: anime.title?.romaji || anime.anime_title_romaji || null,
      anime_title_english: anime.title?.english || anime.anime_title_english || null,
      anime_title_native: anime.title?.native || anime.anime_title_native || null,
      anime_cover: cover,
      anime_banner: banner,
      anime_format: format,
      anime_genres: genres,
      anime_total_episodes: totalEpisodes,
      anime_season: anime.season ?? anime.anime_season ?? null,
      anime_season_year: anime.seasonYear ?? anime.anime_season_year ?? null,
      anime_average_score: avgScore,
      status: updates.status || "PLANNING",
      is_favourite: updates.is_favourite ?? false,
      episodes_watched: Math.max(0, Number(updates.episodes_watched || 0)),
      rewatch_counter: Math.max(0, Number(updates.rewatch_counter || 0)),
      user_score: updates.user_score !== undefined && updates.user_score !== "" ? Number(updates.user_score) : null,
      user_notes: updates.user_notes ?? "",
      custom_lists: Array.isArray(updates.custom_lists) ? updates.custom_lists : [],
      updated_at: new Date().toISOString(),
    };

    if (row.status === "COMPLETED" && totalEpisodes && row.episodes_watched < totalEpisodes) {
      row.episodes_watched = totalEpisodes;
    }

    const { data, error } = await supabase
      .from("user_anime_library")
      .upsert(row, { onConflict: "user_id,anime_id" })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("Error upserting to anime library:", err);
    return { data: null, error: err };
  }
}

/**
 * Update an existing library entry by row ID
 */
export async function updateLibraryEntry(supabase, entryId, fields) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const payload = {
      ...fields,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("user_anime_library")
      .update(payload)
      .eq("id", entryId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Delete single entry from user library
 */
export async function deleteLibraryEntry(supabase, entryId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("user_anime_library")
      .delete()
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Bulk edit entries in the library
 */
export async function bulkUpdateLibraryEntries(supabase, entryIds, updates) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    if (!entryIds || entryIds.length === 0) return { count: 0, error: null };

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
    return { count: data?.length || 0, data, error: null };
  } catch (err) {
    return { count: 0, error: err };
  }
}

/**
 * Bulk delete entries from user library
 */
export async function bulkDeleteLibraryEntries(supabase, entryIds) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    if (!entryIds || entryIds.length === 0) return { count: 0, error: null };

    const { error } = await supabase
      .from("user_anime_library")
      .delete()
      .in("id", entryIds)
      .eq("user_id", user.id);

    if (error) throw error;
    return { success: true, count: entryIds.length, error: null };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Create a new user custom list
 */
export async function createCustomList(supabase, { name, description = "", color = "#ff5238" }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const cleanName = name.trim();
    if (!cleanName) throw new Error("List name is required");

    const { data, error } = await supabase
      .from("user_custom_lists")
      .insert({
        user_id: user.id,
        name: cleanName,
        description,
        color,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Delete a user custom list and remove it from anime entries
 */
export async function deleteCustomList(supabase, listId, listName) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // 1. Delete the custom list definition
    const { error: listErr } = await supabase
      .from("user_custom_lists")
      .delete()
      .eq("id", listId)
      .eq("user_id", user.id);

    if (listErr) throw listErr;

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err };
  }
}
