"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
  LIBRARY_STATUSES,
  STATUS_MAP,
  fetchUserLibrary,
  updateLibraryEntry,
  deleteLibraryEntry,
  bulkUpdateLibraryEntries,
  bulkDeleteLibraryEntries,
  upsertAnimeToLibrary,
} from "@/utils/library";
import LibraryActionModal from "@/app/components/LibraryActionModal";
import RadarCountdown from "@/app/components/RadarCountdown";
import AnimeDetailModal from "@/app/components/AnimeDetailModal";
import StatusIcon from "@/app/components/StatusIcon";
import WatchOptions from "@/app/components/WatchOptions";
import { getAnimeTitle } from "@/utils/anilist";
import {
  Library as LibraryIcon,
  Star,
  Radio,
  SlidersHorizontal,
  RotateCw,
  Trash2,
  Film,
  Zap,
  Tv,
  Check,
  CheckCircle2,
  AlertCircle,
  Lock,
  Plus,
  ArrowRight,
  ArrowLeft,
  X,
  Repeat,
} from "lucide-react";

export default function LibraryPage() {
  const [user, setUser] = useState(null);
  const [library, setLibrary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active filters and views
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL", "CURRENT", "COMPLETED", "PLANNING", "PAUSED", "DROPPED", "FAVOURITES"
  const [selectedCustomList, setSelectedCustomList] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("updated_desc"); // "updated_desc", "score_desc", "title_asc", "progress_desc"
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  // Bulk Edit States
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatusToApply, setBulkStatusToApply] = useState("");
  const [bulkCustomListToApply, setBulkCustomListToApply] = useState("");
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  // Modal edit single entry
  const [editingAnime, setEditingAnime] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Release Radar States
  const [radarItems, setRadarItems] = useState([]);
  const [isRadarLoading, setIsRadarLoading] = useState(false);
  const [radarFilter, setRadarFilter] = useState("ALL"); // "ALL", "AIRING_WEEK", "AIRING_MONTH", "UPCOMING_SEASON", "ANNOUNCED_TBA"
  const [detailModalAnime, setDetailModalAnime] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToastMsg = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load User & Library on Demand
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await fetchUserLibrary(supabase);

    if (error) {
      if (!error.message?.includes("does not exist") && error.code !== "PGRST205") {
        showToastMsg("Error loading library: " + error.message, "error");
      }
      setLibrary([]);
    } else {
      setLibrary(data || []);
    }
    setIsLoading(false);
  }, [showToastMsg]);

  useEffect(() => {
    let isCancelled = false;

    async function initialFetch() {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (isCancelled) return;
      setUser(currentUser);

      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await fetchUserLibrary(supabase);
      if (isCancelled) return;

      if (error) {
        setLibrary([]);
      } else {
        setLibrary(data || []);
      }
      setIsLoading(false);
    }

    initialFetch();

    // Listen for auth change
    const supabase = createClient();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadData();
      } else {
        setLibrary([]);
      }
    });

    return () => {
      isCancelled = true;
      authListener?.subscription?.unsubscribe();
    };
  }, [loadData]);

  // Fetch Release Radar Sequels whenever library updates
  useEffect(() => {
    if (!library || library.length === 0) return;

    let isMounted = true;
    const animeIds = library.map((item) => item.anime_id);

    async function fetchRadar() {
      try {
        setIsRadarLoading(true);
        const res = await fetch("/api/anime/radar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animeIds }),
        });
        const data = await res.json();
        if (isMounted && data?.success) {
          setRadarItems(data.radar || []);
        }
      } catch (err) {
        console.error("Error fetching radar:", err);
      } finally {
        if (isMounted) setIsRadarLoading(false);
      }
    }

    fetchRadar();

    return () => {
      isMounted = false;
    };
  }, [library]);

  const handleAddRadarAnimeToLibrary = async (radarAnime) => {
    if (!user) {
      showToastMsg("Please sign in to add anime to your library", "error");
      return;
    }

    const supabase = createClient();
    const { data, error } = await upsertAnimeToLibrary(supabase, radarAnime, {
      status: "PLANNING",
      custom_lists: ["Radar Tracked"],
    });

    if (error) {
      showToastMsg("Failed to add anime: " + error.message, "error");
    } else {
      const displayTitle = getAnimeTitle(radarAnime.title);
      showToastMsg(`Added "${displayTitle}" to Plan to Watch!`);
      setLibrary((prev) => {
        const filtered = prev.filter((item) => item.anime_id !== radarAnime.id);
        return [data, ...filtered];
      });
    }
  };

  // Compute available custom lists in the user's library
  const userCustomLists = useMemo(() => {
    const lists = new Set();
    library.forEach((item) => {
      if (Array.isArray(item.custom_lists)) {
        item.custom_lists.forEach((list) => lists.add(list));
      }
    });
    return Array.from(lists);
  }, [library]);

  // Library summary statistics
  const stats = useMemo(() => {
    let total = library.length;
    let watching = 0;
    let completed = 0;
    let planning = 0;
    let paused = 0;
    let dropped = 0;
    let favourites = 0;
    let totalEpisodes = 0;
    let totalRewatches = 0;

    library.forEach((item) => {
      if (item.status === "CURRENT") watching++;
      if (item.status === "COMPLETED") completed++;
      if (item.status === "PLANNING") planning++;
      if (item.status === "PAUSED") paused++;
      if (item.status === "DROPPED") dropped++;
      if (item.is_favourite) favourites++;
      totalEpisodes += item.episodes_watched || 0;
      totalRewatches += item.rewatch_counter || 0;
    });

    return { total, watching, completed, planning, paused, dropped, favourites, totalEpisodes, totalRewatches };
  }, [library]);

  // Filtered & Sorted Anime List
  const filteredLibrary = useMemo(() => {
    let result = [...library];

    // 1. Status / Favourite tab filter
    if (activeTab === "FAVOURITES") {
      result = result.filter((item) => Boolean(item.is_favourite));
    } else if (activeTab !== "ALL") {
      result = result.filter((item) => item.status === activeTab);
    }

    // 2. Custom list filter
    if (selectedCustomList !== "ALL") {
      result = result.filter((item) => Array.isArray(item.custom_lists) && item.custom_lists.includes(selectedCustomList));
    }

    // 3. Format filter
    if (formatFilter !== "ALL") {
      result = result.filter((item) => (item.anime_format || "TV").toUpperCase() === formatFilter);
    }

    // 4. Live Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const title = (item.anime_title || "").toLowerCase();
        const romaji = (item.anime_title_romaji || "").toLowerCase();
        const eng = (item.anime_title_english || "").toLowerCase();
        const genres = (item.anime_genres || []).join(" ").toLowerCase();
        return title.includes(q) || romaji.includes(q) || eng.includes(q) || genres.includes(q);
      });
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === "updated_desc") {
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      }
      if (sortBy === "score_desc") {
        const scoreA = a.user_score ?? a.anime_average_score ?? 0;
        const scoreB = b.user_score ?? b.anime_average_score ?? 0;
        return scoreB - scoreA;
      }
      if (sortBy === "title_asc") {
        return (a.anime_title || "").localeCompare(b.anime_title || "");
      }
      if (sortBy === "progress_desc") {
        return (b.episodes_watched || 0) - (a.episodes_watched || 0);
      }
      return 0;
    });

    return result;
  }, [library, activeTab, selectedCustomList, formatFilter, searchQuery, sortBy]);

  // Radar Statistics & Filtered Radar Items
  const radarStats = useMemo(() => {
    let week = 0;
    let month = 0;
    let season = 0;
    let tba = 0;
    radarItems.forEach((item) => {
      if (item.urgency === "AIRING_WEEK") week++;
      else if (item.urgency === "AIRING_MONTH") month++;
      else if (item.urgency === "UPCOMING_SEASON") season++;
      else if (item.urgency === "ANNOUNCED_TBA") tba++;
    });
    return { week, month, season, tba };
  }, [radarItems]);

  const filteredRadarItems = useMemo(() => {
    if (radarFilter === "ALL") return radarItems;
    return radarItems.filter((item) => item.urgency === radarFilter);
  }, [radarItems, radarFilter]);

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLibrary.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLibrary.map((item) => item.id)));
    }
  };

  const toggleSelectItem = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Bulk Apply Status
  const handleBulkStatusChange = async (newStatus) => {
    if (!newStatus || selectedIds.size === 0) return;
    setIsBulkSaving(true);
    const supabase = createClient();
    const ids = Array.from(selectedIds);
    const { count, error } = await bulkUpdateLibraryEntries(supabase, ids, { status: newStatus });

    if (error) {
      showToastMsg("Bulk update failed: " + error.message, "error");
    } else {
      showToastMsg(`Updated ${count} anime status to ${STATUS_MAP[newStatus]?.label || newStatus}`);
      setLibrary((prev) =>
        prev.map((item) => (ids.includes(item.id) ? { ...item, status: newStatus } : item))
      );
      setSelectedIds(new Set());
      setBulkStatusToApply("");
    }
    setIsBulkSaving(false);
  };

  // Bulk Toggle Favourites
  const handleBulkToggleFavourite = async (flag) => {
    if (selectedIds.size === 0) return;
    setIsBulkSaving(true);
    const supabase = createClient();
    const ids = Array.from(selectedIds);
    const { count, error } = await bulkUpdateLibraryEntries(supabase, ids, { is_favourite: flag });

    if (error) {
      showToastMsg("Bulk favourite update failed: " + error.message, "error");
    } else {
      showToastMsg(`Marked ${count} anime as ${flag ? "Favourite" : "Unfavourite"}`);
      setLibrary((prev) =>
        prev.map((item) => (ids.includes(item.id) ? { ...item, is_favourite: flag } : item))
      );
      setSelectedIds(new Set());
    }
    setIsBulkSaving(false);
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to remove ${selectedIds.size} anime from your library?`)) return;

    setIsBulkSaving(true);
    const supabase = createClient();
    const ids = Array.from(selectedIds);
    const { success, error } = await bulkDeleteLibraryEntries(supabase, ids);

    if (error) {
      showToastMsg("Bulk delete failed: " + error.message, "error");
    } else {
      showToastMsg(`Removed ${ids.length} anime from library`);
      setLibrary((prev) => prev.filter((item) => !ids.includes(item.id)));
      setSelectedIds(new Set());
    }
    setIsBulkSaving(false);
  };

  // Bulk Add Custom List
  const handleBulkAddCustomList = async (listName) => {
    const clean = listName?.trim();
    if (!clean || selectedIds.size === 0) return;
    setIsBulkSaving(true);
    const supabase = createClient();
    const ids = Array.from(selectedIds);

    // Compute updated custom lists per entry
    const promises = ids.map(async (id) => {
      const item = library.find((l) => l.id === id);
      if (!item) return;
      const currentLists = Array.isArray(item.custom_lists) ? item.custom_lists : [];
      if (!currentLists.includes(clean)) {
        const nextLists = [...currentLists, clean];
        await updateLibraryEntry(supabase, id, { custom_lists: nextLists });
      }
    });

    await Promise.all(promises);
    showToastMsg(`Added "${clean}" list to ${ids.length} selected anime`);
    setLibrary((prev) =>
      prev.map((item) => {
        if (ids.includes(item.id)) {
          const cl = Array.isArray(item.custom_lists) ? item.custom_lists : [];
          return cl.includes(clean) ? item : { ...item, custom_lists: [...cl, clean] };
        }
        return item;
      })
    );
    setSelectedIds(new Set());
    setBulkCustomListToApply("");
    setIsBulkSaving(false);
  };

  // Quick Inline Actions on a single card
  const handleQuickIncrementEpisode = async (e, item) => {
    e.stopPropagation();
    const current = item.episodes_watched || 0;
    const max = item.anime_total_episodes;
    if (max && current >= max) return;

    const next = current + 1;
    const isCompleted = max && next >= max;
    const updates = {
      episodes_watched: next,
      status: isCompleted ? "COMPLETED" : item.status === "PLANNING" ? "CURRENT" : item.status,
    };

    setLibrary((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, ...updates } : x))
    );

    const supabase = createClient();
    await updateLibraryEntry(supabase, item.id, updates);
  };

  const handleQuickToggleFavourite = async (e, item) => {
    e.stopPropagation();
    const next = !item.is_favourite;
    setLibrary((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, is_favourite: next } : x))
    );
    const supabase = createClient();
    await updateLibraryEntry(supabase, item.id, { is_favourite: next });
  };



  return (
    <div className="min-h-screen bg-[#07090e] text-[#e8ebf2] font-sans selection:bg-[#ff5238] selection:text-white pb-32">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border animate-fadeIn ${
          toast.type === "error"
            ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
            : "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
        }`}>
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ================= TOP NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-[#07090e]/95 backdrop-blur-md border-b border-[#181d2a]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#8e9cb9] hover:text-white transition-colors bg-[#111520] border border-[#212739] px-3.5 py-1.5 rounded-xl group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>

            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff5b42] to-[#f03b24] flex items-center justify-center font-black text-white text-sm shadow-md shadow-[#ff5238]/30">
                W
              </div>
              <span className="font-bold tracking-widest text-sm text-white hidden sm:inline">WATCHNEXT</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ff5238] to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {(user.user_metadata?.username?.[0] || user.email?.[0] || "U").toUpperCase()}
                </div>
                <span className="text-xs font-medium text-white max-w-[120px] truncate hidden sm:inline">
                  {user.user_metadata?.username || user.email?.split("@")[0]}
                </span>
              </div>
            ) : (
              <Link
                href="/signin"
                className="text-xs font-semibold bg-[#ff5238] hover:bg-[#ff674e] text-white px-3.5 py-1.5 rounded-xl shadow-md transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* ================= HEADER & STATS BANNER ================= */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#101422] via-[#0e121d] to-[#151928] border border-[#21293c] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase text-[#ff5238] bg-[#ff5238]/10 px-2.5 py-0.5 rounded-full border border-[#ff5238]/20">
                  Database Synced • PostgreSQL
                </span>
                <span className="text-xs text-[#7180a0]">• AniList Connected</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Personal Anime Library
              </h1>
              <p className="text-xs sm:text-sm text-[#8c9bb9] max-w-xl">
                Organize your anime universe: track episodes watched, manage rewatches, build custom lists, and bulk-manage your collection.
              </p>
            </div>

            {/* Quick action button to trigger bulk edit */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsBulkMode(!isBulkMode);
                  if (isBulkMode) setSelectedIds(new Set());
                }}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer border ${
                  isBulkMode
                    ? "bg-[#ff5238] border-[#ff5238] text-white shadow-lg shadow-[#ff5238]/30"
                    : "bg-[#161c2a] border-[#29344c] text-[#a0acc7] hover:text-white hover:bg-[#1f2638]"
                }`}
              >
                {isBulkMode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Done Editing</span>
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Bulk Edit Entries</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={loadData}
                className="w-9 h-9 rounded-xl bg-[#161c2a] border border-[#29344c] text-[#a0acc7] hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
                title="Refresh Library"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6 border-t border-[#1b2336] mt-6">
            <div className="bg-[#0b0e16]/80 border border-[#1e2538] rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-[#7382a2]">Total Library</span>
              <p className="text-xl font-black text-white">{stats.total}</p>
            </div>
            <div className="bg-[#0b0e16]/80 border border-[#1e2538] rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-emerald-400">Watching</span>
              <p className="text-xl font-black text-emerald-400">{stats.watching}</p>
            </div>
            <div className="bg-[#0b0e16]/80 border border-[#1e2538] rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-blue-400">Completed</span>
              <p className="text-xl font-black text-blue-400">{stats.completed}</p>
            </div>
            <div className="bg-[#0b0e16]/80 border border-[#1e2538] rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-purple-400">Plan to Watch</span>
              <p className="text-xl font-black text-purple-400">{stats.planning}</p>
            </div>
            <div className="bg-[#0b0e16]/80 border border-[#1e2538] rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-amber-400">On Hold</span>
              <p className="text-xl font-black text-amber-400">{stats.paused}</p>
            </div>
            <div className="bg-[#0b0e16]/80 border border-[#1e2538] rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-rose-400">Favourites</span>
              <p className="text-xl font-black text-rose-400">{stats.favourites}</p>
            </div>
          </div>
        </section>



        {/* ================= GUEST SIGN IN BANNER (If not authenticated) ================= */}
        {!user && !isLoading && (
          <section className="bg-gradient-to-r from-blue-950/40 via-[#101524] to-[#121626] border border-blue-500/30 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sign In to Save Your Personal Library</h3>
                <p className="text-xs text-[#8c9cb9]">
                  Log in to synchronize your anime watch progress, rewatch records, and custom lists to your personal account.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/signin"
                className="text-xs font-semibold bg-[#1a2133] hover:bg-[#252f47] border border-[#2b3752] text-white px-4 py-2 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-xs font-bold bg-[#ff5238] hover:bg-[#ff684f] text-white px-4 py-2 rounded-xl shadow-md transition-all"
              >
                Create Account
              </Link>
            </div>
          </section>
        )}

        {/* ================= STATUS FILTER TABS ================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {/* All Library */}
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "ALL"
                  ? "bg-white text-black shadow-md shadow-white/20 scale-105"
                  : "bg-[#111520] border border-[#202739] text-[#8e9cb8] hover:text-white"
              }`}
            >
              <LibraryIcon className="w-3.5 h-3.5" />
              <span>All</span>
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full font-mono">{stats.total}</span>
            </button>

            {/* Status Tabs */}
            {LIBRARY_STATUSES.filter((s) => s.id !== "ALL").map((s) => {
              const count =
                s.id === "CURRENT" ? stats.watching :
                s.id === "COMPLETED" ? stats.completed :
                s.id === "PLANNING" ? stats.planning :
                s.id === "PAUSED" ? stats.paused :
                s.id === "DROPPED" ? stats.dropped : 0;
              const isSelected = activeTab === s.id;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveTab(s.id)}
                  className={`px-3.5 py-2 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? "bg-white text-black shadow-md shadow-white/20 scale-105"
                      : "bg-[#111520] border border-[#202739] text-[#8e9cb8] hover:text-white"
                  }`}
                >
                  <StatusIcon status={s.id} className="w-3.5 h-3.5" />
                  <span>{s.label}</span>
                  <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full font-mono">{count}</span>
                </button>
              );
            })}

            {/* Favourites Tab */}
            <button
              type="button"
              onClick={() => setActiveTab("FAVOURITES")}
              className={`px-3.5 py-2 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "FAVOURITES"
                  ? "bg-amber-400 text-black shadow-md shadow-amber-400/20 scale-105"
                  : "bg-[#111520] border border-[#202739] text-amber-400/80 hover:text-amber-300"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Favourites</span>
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full font-mono text-black font-bold">
                {stats.favourites}
              </span>
            </button>

            {/* Release Radar Tab */}
            <button
              type="button"
              onClick={() => setActiveTab("RADAR")}
              className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "RADAR"
                  ? "bg-gradient-to-r from-[#ff5238] to-[#ff7355] text-white shadow-lg shadow-[#ff5238]/30 scale-105"
                  : "bg-[#111520] border border-[#ff5238]/40 text-[#ff684e] hover:bg-[#ff5238]/10"
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${radarItems.length > 0 ? "animate-pulse" : ""}`} />
              <span>Release Radar</span>
              <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono text-white font-bold">
                {isRadarLoading ? "..." : radarItems.length}
              </span>
            </button>
          </div>

          {/* Radar Detected Alert Banner (Shows when updates detected and not on radar tab) */}
          {radarItems.length > 0 && activeTab !== "RADAR" && (
            <div className="bg-gradient-to-r from-[#ff5238]/15 via-[#18131e] to-[#0d101a] border border-[#ff5238]/40 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff5238]/20 border border-[#ff5238]/30 flex items-center justify-center shrink-0">
                  <Radio className="w-5 h-5 text-[#ff5238] animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Sequel Radar Alert</span>
                    <span className="bg-[#ff5238] text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                      {radarItems.length} New Upcoming Updates
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#91a0be] mt-0.5">
                    Upcoming seasons, sequels, or movies detected for anime in your personal library!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("RADAR")}
                className="bg-[#ff5238] hover:bg-[#ff684f] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-[#ff5238]/25 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <span>View Release Radar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ================= SEARCH & TOOLBAR (Hidden in Radar mode) ================= */}
          {activeTab !== "RADAR" && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0d101a] border border-[#1d2436] rounded-2xl p-3 text-xs">
            {/* Search within library */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your library by title, romaji, or genre..."
                className="w-full bg-[#121624] border border-[#252f45] focus:border-[#ff5238] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#586684] outline-none"
              />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#586684]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7382a0] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns: Custom Lists, Format, Sort & View Mode */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Custom Lists Filter */}
              {userCustomLists.length > 0 && (
                <select
                  value={selectedCustomList}
                  onChange={(e) => setSelectedCustomList(e.target.value)}
                  className="bg-[#121624] border border-[#252f45] text-white px-3 py-2 rounded-xl outline-none cursor-pointer"
                >
                  <option value="ALL">All Custom Lists</option>
                  {userCustomLists.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              )}

              {/* Format Filter */}
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="bg-[#121624] border border-[#252f45] text-white px-3 py-2 rounded-xl outline-none cursor-pointer"
              >
                <option value="ALL">All Formats</option>
                <option value="TV">TV Series</option>
                <option value="MOVIE">Movie</option>
                <option value="OVA">OVA</option>
                <option value="ONA">ONA</option>
                <option value="SPECIAL">Special</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#121624] border border-[#252f45] text-white px-3 py-2 rounded-xl outline-none cursor-pointer"
              >
                <option value="updated_desc">Recently Updated</option>
                <option value="score_desc">Highest Score</option>
                <option value="title_asc">Title (A - Z)</option>
                <option value="progress_desc">Most Episodes Watched</option>
              </select>

              {/* View Mode Toggle: Grid vs Table */}
              <div className="flex items-center bg-[#121624] border border-[#252f45] rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid" ? "bg-[#ff5238] text-white shadow-sm" : "text-[#7382a0] hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "table" ? "bg-[#ff5238] text-white shadow-sm" : "text-[#7382a0] hover:text-white"
                  }`}
                  title="Table View"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          )}
        </section>

        {/* ================= BULK ACTIONS FLOATING TOOLBAR ================= */}
        {isBulkMode && (
          <section className="bg-gradient-to-r from-[#171d2b] to-[#141825] border border-[#ff5238]/40 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs bg-[#1f2638] hover:bg-[#28324a] border border-[#323f5c] text-white font-semibold px-3 py-1.5 rounded-xl cursor-pointer"
              >
                {selectedIds.size === filteredLibrary.length && filteredLibrary.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <span className="text-xs font-bold text-white">
                <span className="text-[#ff5238]">{selectedIds.size}</span> of {filteredLibrary.length} selected
              </span>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Bulk Status Dropdown */}
                <select
                  value={bulkStatusToApply}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBulkStatusToApply(val);
                    if (val) handleBulkStatusChange(val);
                  }}
                  disabled={isBulkSaving}
                  className="bg-[#0e121d] border border-[#2b354d] text-white px-3 py-1.5 rounded-xl outline-none cursor-pointer"
                >
                  <option value="">Move Status...</option>
                  <option value="CURRENT">Currently Watching</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PLANNING">Plan to Watch</option>
                  <option value="PAUSED">On Hold</option>
                  <option value="DROPPED">Dropped</option>
                </select>

                {/* Bulk Favourite */}
                <button
                  type="button"
                  onClick={() => handleBulkToggleFavourite(true)}
                  disabled={isBulkSaving}
                  className="bg-[#1f2638] hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>Star</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBulkToggleFavourite(false)}
                  disabled={isBulkSaving}
                  className="bg-[#1f2638] hover:bg-white/10 text-[#8e9cb9] border border-[#2e394f] px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Unstar
                </button>

                {/* Bulk Custom List Input */}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Add to list..."
                    value={bulkCustomListToApply}
                    onChange={(e) => setBulkCustomListToApply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleBulkAddCustomList(bulkCustomListToApply);
                      }
                    }}
                    className="w-28 sm:w-36 bg-[#0e121d] border border-[#2b354d] rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-[#505d7a] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleBulkAddCustomList(bulkCustomListToApply)}
                    disabled={isBulkSaving || !bulkCustomListToApply.trim()}
                    className="bg-[#242d42] hover:bg-[#ff5238] text-white font-bold px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Bulk Delete */}
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={isBulkSaving}
                  className="bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* ================= RELEASE RADAR VIEW ================= */}
        {activeTab === "RADAR" ? (
          <section className="space-y-6 animate-fadeIn">
            {/* Radar Header & Urgency Filters */}
            <div className="bg-[#0d101a] border border-[#1d2436] rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b2234] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#ff5238]" />
                    <span>Sequel Radar & Release Countdowns</span>
                    <span className="text-xs bg-[#ff5238]/20 text-[#ff5238] border border-[#ff5238]/30 px-2 py-0.5 rounded-full font-bold">
                      Live Tracking
                    </span>
                  </h3>
                  <p className="text-xs text-[#7e8ea9] mt-0.5">
                    Automatically tracking announced sequels, next seasons, and movies for anime in your library.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#6e7e9a]">Found {radarItems.length} upcoming releases</span>
                </div>
              </div>

              {/* Urgency Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRadarFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    radarFilter === "ALL"
                      ? "bg-white text-black shadow-md shadow-white/20"
                      : "bg-[#141826] border border-[#222a3d] text-[#8e9cb8] hover:text-white"
                  }`}
                >
                  <span>All Upcoming</span>
                  <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full font-mono">{radarItems.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRadarFilter("AIRING_WEEK")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    radarFilter === "AIRING_WEEK"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                      : "bg-[#141826] border border-rose-500/30 text-rose-300 hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                  <span>Airing This Week</span>
                  <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono">{radarStats.week}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRadarFilter("AIRING_MONTH")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    radarFilter === "AIRING_MONTH"
                      ? "bg-amber-400 text-black shadow-md shadow-amber-400/30"
                      : "bg-[#141826] border border-amber-500/30 text-amber-300 hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Airing This Month</span>
                  <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono">{radarStats.month}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRadarFilter("UPCOMING_SEASON")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    radarFilter === "UPCOMING_SEASON"
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/30"
                      : "bg-[#141826] border border-blue-500/30 text-blue-300 hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Next Season</span>
                  <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono">{radarStats.season}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRadarFilter("ANNOUNCED_TBA")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    radarFilter === "ANNOUNCED_TBA"
                      ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                      : "bg-[#141826] border border-purple-500/30 text-purple-300 hover:text-white"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  <span>Announced / TBA</span>
                  <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full font-mono">{radarStats.tba}</span>
                </button>
              </div>
            </div>

            {/* Radar Cards Grid */}
            {isRadarLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="aspect-[3/4.8] bg-[#121624] rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : filteredRadarItems.length === 0 ? (
              <div className="p-12 text-center bg-[#0d101a] border border-[#1b2234] rounded-3xl space-y-3">
                <Radio className="w-10 h-10 text-[#556482] mx-auto" />
                <h3 className="text-base font-bold text-white">No Upcoming Releases in this Category</h3>
                <p className="text-xs text-[#7584a2] max-w-sm mx-auto">
                  {radarItems.length === 0
                    ? "Add anime you have watched or are currently watching to your library, and upcoming sequels will automatically appear here!"
                    : "No sequels match your active urgency filter."}
                </p>
                {radarFilter !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setRadarFilter("ALL")}
                    className="text-xs text-[#ff5238] hover:underline font-bold cursor-pointer"
                  >
                    View All Upcoming Releases ({radarItems.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {filteredRadarItems.map((item) => {
                  const isSavedInLibrary = library.some((l) => l.anime_id === item.id);
                  const isUrgent = item.urgency === "AIRING_WEEK";
                  const isApproaching = item.urgency === "AIRING_MONTH";
                  const title = getAnimeTitle(item.title);

                  return (
                    <div
                      key={item.id}
                      className={`group relative flex flex-col bg-[#0d101a] border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                        isUrgent
                          ? "border-rose-500/60 shadow-lg shadow-rose-500/20"
                          : isApproaching
                          ? "border-amber-500/50 shadow-md shadow-amber-500/15"
                          : "border-[#1c2336] hover:border-[#2f3b57] hover:shadow-xl"
                      }`}
                    >
                      {/* Poster image with Urgency & Relation Badges */}
                      <div
                        onClick={() => setDetailModalAnime(item)}
                        className="relative aspect-[3/4.2] w-full bg-[#121624] overflow-hidden cursor-pointer"
                      >
                        <Image
                          src={item.coverImage?.extraLarge || item.coverImage?.large || "/images/hero-art.jpg"}
                          alt={title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 220px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d101a] via-transparent to-transparent opacity-90"></div>

                        {/* Unified Top Header Bar (Prevents any overlap between badges) */}
                        <div className="absolute top-2 inset-x-2 z-10 flex items-start justify-between gap-1.5 pointer-events-none">
                          {/* Relation Badge */}
                          <div className="min-w-0 flex-1">
                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md bg-black/80 border-white/20 text-white max-w-full">
                              {item.relationType === "SELF" ? (
                                <span className="inline-flex items-center gap-1 truncate">
                                  <Tv className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <strong className="text-emerald-400">In Watchlist</strong>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 truncate">
                                  <Zap className="w-3 h-3 text-[#ff5238] shrink-0" />
                                  <span>{item.relationBadge} to</span>
                                  <strong className="text-[#ff5238] truncate">{item.parentAnimeTitle}</strong>
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Urgency Badge */}
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-lg border backdrop-blur-md shrink-0 whitespace-nowrap shadow-md ${
                              isUrgent
                                ? "bg-rose-950/95 text-rose-300 border-rose-500/60 animate-pulse"
                                : isApproaching
                                ? "bg-amber-950/95 text-amber-300 border-amber-500/60"
                                : "bg-blue-950/95 text-blue-300 border-blue-500/50"
                            }`}
                          >
                            {item.urgencyLabel}
                          </span>
                        </div>

                        {/* Format & Studio Badge */}
                        <div className="absolute bottom-2 left-2.5 z-10 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold bg-[#141826]/90 border border-white/10 text-[#a0b0cf] px-1.5 py-0.5 rounded-md backdrop-blur-md">
                            {item.format || "TV"}
                          </span>
                          {item.studios?.[0] && (
                            <span className="text-[10px] font-semibold bg-[#141826]/90 border border-white/10 text-[#8ea0c2] px-1.5 py-0.5 rounded-md backdrop-blur-md truncate max-w-[120px]">
                              {item.studios[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content & Countdown */}
                      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                        <div onClick={() => setDetailModalAnime(item)} className="cursor-pointer space-y-1">
                          <h4 
                            title={title}
                            className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-[#ff5238] transition-colors min-h-[2rem]"
                          >
                            {title}
                          </h4>
                          {item.title?.romaji && item.title?.romaji !== title && (
                            <p className="text-[10px] text-[#6b7b99] line-clamp-1 italic" title={item.title.romaji}>
                              {item.title.romaji}
                            </p>
                          )}
                        </div>

                        {/* Countdown Ticker */}
                        <div className="pt-2 border-t border-[#182030] space-y-1.5">
                          <RadarCountdown
                            targetTimestamp={item.targetTimestamp}
                            datePrecision={item.datePrecision}
                            urgency={item.urgency}
                          />
                        </div>

                        {/* Action: Add to Plan to Watch / Already Tracked */}
                        <div className="pt-1">
                          {isSavedInLibrary ? (
                            <div className="w-full py-2 bg-[#101420] border border-[#232c40] text-[#7ea0cb] text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 select-none">
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Tracked in Your Library</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddRadarAnimeToLibrary(item)}
                              className="w-full py-2 bg-[#ff5238] hover:bg-[#ff684f] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#ff5238]/25 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Plan to Watch</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
        /* ================= ANIME LISTINGS (GRID OR TABLE) ================= */
        isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[3/4.6] bg-[#121624] rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredLibrary.length === 0 ? (
          <div className="p-12 text-center bg-[#0d101a] border border-[#1b2234] rounded-3xl space-y-3">
            <Film className="w-10 h-10 text-[#556482] mx-auto" />
            <h3 className="text-base font-bold text-white">No Anime Found in this View</h3>
            <p className="text-xs text-[#7584a2] max-w-sm mx-auto">
              {library.length === 0
                ? "Your library is currently empty. Explore trending anime and click '+ Add to Library' to build your collection!"
                : "No entries match your active filters or search keyword."}
            </p>
            {library.length === 0 ? (
              <Link
                href="/"
                className="inline-block mt-2 bg-[#ff5238] hover:bg-[#ff684e] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-[#ff5238]/30 transition-all"
              >
                Discover Anime to Watch →
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ALL");
                  setSelectedCustomList("ALL");
                  setSearchQuery("");
                  setFormatFilter("ALL");
                }}
                className="text-xs text-[#ff5238] hover:underline font-bold cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* ================= GRID VIEW ================= */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredLibrary.map((item) => {
              const statusCfg = STATUS_MAP[item.status] || STATUS_MAP.PLANNING;
              const isSelected = selectedIds.has(item.id);
              const progressPct =
                item.anime_total_episodes && item.anime_total_episodes > 0
                  ? Math.min(100, Math.round(((item.episodes_watched || 0) / item.anime_total_episodes) * 100))
                  : null;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isBulkMode) toggleSelectItem(item.id);
                    else {
                      setEditingAnime(item);
                      setIsModalOpen(true);
                    }
                  }}
                  className={`group relative flex flex-col bg-[#0d101a] border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#ff5238] ring-2 ring-[#ff5238]/50 shadow-xl shadow-[#ff5238]/20"
                      : "border-[#1c2336] hover:border-[#2f3b57] hover:shadow-xl hover:-translate-y-1"
                  }`}
                >
                  {/* Poster Thumbnail */}
                  <div className="relative aspect-[3/4.2] w-full bg-[#121624] overflow-hidden">
                    <Image
                      src={item.anime_cover || "/images/hero-art.jpg"}
                      alt={item.anime_title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d101a] via-transparent to-transparent opacity-80"></div>

                    {/* Checkbox (Bulk Mode) */}
                    {isBulkMode && (
                      <div className="absolute top-2 left-2 z-20">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.id)}
                          className="w-4 h-4 rounded accent-[#ff5238] cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Favourite Star Badge */}
                    <button
                      type="button"
                      onClick={(e) => handleQuickToggleFavourite(e, item)}
                      className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs backdrop-blur-md transition-all cursor-pointer z-10 ${
                        item.is_favourite
                          ? "bg-amber-400 text-black shadow-md shadow-amber-400/30 scale-110"
                          : "bg-black/60 text-white/40 hover:text-white hover:bg-black/90"
                      }`}
                      title={item.is_favourite ? "Favorited" : "Mark as Favourite"}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.is_favourite ? "fill-black text-black" : "fill-current"}`} />
                    </button>

                    {/* Status Badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md ${statusCfg.bg}`}>
                        {statusCfg.shortLabel}
                      </span>
                    </div>

                    {/* User Score Badge */}
                    {item.user_score !== null && (
                      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md border border-amber-400/30 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        <span>{item.user_score}</span>
                      </div>
                    )}

                    {/* Quick Hover Stream Options */}
                    <div className="absolute inset-x-2 bottom-8 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1.5 backdrop-blur-md bg-black/90 p-1 rounded-xl border border-white/20 shadow-xl">
                      <WatchOptions anime={{ title: item.anime_title }} compact />
                    </div>
                  </div>

                  {/* Card Info Details */}
                  <div className="p-3 flex flex-col flex-1 justify-between gap-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff5238] transition-colors">
                        {item.anime_title}
                      </h4>
                      <p className="text-[10px] text-[#6b7b99] line-clamp-1">
                        {item.anime_format || "TV"} • {item.anime_season ? `${item.anime_season} ${item.anime_season_year || ""}` : "Anime"}
                      </p>
                    </div>

                    {/* Progress Bar & Quick +1 Increment */}
                    <div className="space-y-1.5 pt-1 border-t border-[#161d2d]">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#8b9bb8]">
                        <span>
                          {item.episodes_watched || 0}
                          <span className="text-[#556482]">
                            {item.anime_total_episodes ? ` / ${item.anime_total_episodes}` : " eps"}
                          </span>
                        </span>

                        {/* Quick +1 Button */}
                        <button
                          type="button"
                          onClick={(e) => handleQuickIncrementEpisode(e, item)}
                          className="bg-[#171f2e] hover:bg-[#ff5238] text-[#8e9ebc] hover:text-white px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                          title="Watched +1 episode"
                        >
                          +1
                        </button>
                      </div>

                      {/* Episode Progress Bar */}
                      {progressPct !== null && (
                        <div className="w-full bg-[#161d2c] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              item.status === "COMPLETED" ? "bg-blue-400" : "bg-[#ff5238]"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>
                      )}

                      {/* Rewatch Counter tag if > 0 */}
                      {item.rewatch_counter > 0 && (
                        <p className="text-[10px] text-[#ffb703] font-medium flex items-center gap-1">
                          <Repeat className="w-3 h-3 text-[#ffb703] shrink-0" />
                          <span>Rewatched {item.rewatch_counter}x</span>
                        </p>
                      )}

                      {/* Custom list tag previews */}
                      {item.custom_lists?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {item.custom_lists.slice(0, 2).map((list) => (
                            <span
                              key={list}
                              className="text-[9px] bg-purple-950/60 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded truncate max-w-[90px]"
                            >
                              {list}
                            </span>
                          ))}
                          {item.custom_lists.length > 2 && (
                            <span className="text-[9px] text-[#6b7b99]">+{item.custom_lists.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ================= TABLE LIST VIEW ================= */
          <div className="overflow-x-auto bg-[#0d101a] border border-[#1b2234] rounded-2xl shadow-xl">
            <table className="w-full text-left text-xs text-[#a0afcf]">
              <thead className="bg-[#111522] border-b border-[#1b2234] text-[11px] font-bold uppercase tracking-wider text-[#6f7e9f]">
                <tr>
                  {isBulkMode && <th className="p-3 w-8"></th>}
                  <th className="p-3 w-12">Cover</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Progress</th>
                  <th className="p-3 text-center">Rewatches</th>
                  <th className="p-3 text-center">Score</th>
                  <th className="p-3">Custom Lists</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151c2c]">
                {filteredLibrary.map((item) => {
                  const statusCfg = STATUS_MAP[item.status] || STATUS_MAP.PLANNING;
                  const isSelected = selectedIds.has(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#121726] transition-colors cursor-pointer ${
                        isSelected ? "bg-[#ff5238]/10" : ""
                      }`}
                      onClick={() => {
                        if (isBulkMode) toggleSelectItem(item.id);
                        else {
                          setEditingAnime(item);
                          setIsModalOpen(true);
                        }
                      }}
                    >
                      {isBulkMode && (
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(item.id)}
                            className="w-4 h-4 rounded accent-[#ff5238] cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="p-3">
                        <div className="relative w-9 h-12 rounded bg-[#161c2c] overflow-hidden shrink-0">
                          <Image src={item.anime_cover || "/images/hero-art.jpg"} alt={item.anime_title} fill className="object-cover" sizes="36px" />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white hover:text-[#ff5238] transition-colors">
                            {item.anime_title}
                          </span>
                          {item.is_favourite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-[#5e6d8a]">
                          {item.anime_format || "TV"} • {item.anime_season || "Anime"} {item.anime_season_year || ""}
                        </p>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusCfg.bg}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5 font-semibold text-white">
                          <span>{item.episodes_watched || 0}</span>
                          <span className="text-[#556482]">/ {item.anime_total_episodes || "?"}</span>
                          <button
                            type="button"
                            onClick={(e) => handleQuickIncrementEpisode(e, item)}
                            className="bg-[#1a2133] hover:bg-[#ff5238] text-white px-1.5 py-0.5 rounded text-[10px] font-bold ml-1 cursor-pointer"
                          >
                            +1
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center font-semibold">
                        {item.rewatch_counter > 0 ? (
                          <span className="text-amber-400 font-bold">{item.rewatch_counter}x</span>
                        ) : (
                          <span className="text-[#556482]">0</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {item.user_score !== null ? (
                          <span className="bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-0.5 rounded font-black">
                            {item.user_score}
                          </span>
                        ) : (
                          <span className="text-[#556482]">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {item.custom_lists?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.custom_lists.map((l) => (
                              <span key={l} className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
                                {l}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[#556482]">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <WatchOptions anime={{ title: item.anime_title }} compact />
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAnime(item);
                              setIsModalOpen(true);
                            }}
                            className="bg-[#161c2a] hover:bg-[#20273a] text-white font-semibold text-[11px] px-3 py-1 rounded-lg border border-[#273248] transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
      </main>

      {/* ================= EDIT MODAL ================= */}
      {editingAnime && (
        <LibraryActionModal
          anime={{
            id: editingAnime.anime_id,
            anime_id: editingAnime.anime_id,
            title: editingAnime.anime_title,
            coverImage: { extraLarge: editingAnime.anime_cover },
            bannerImage: editingAnime.anime_banner,
            format: editingAnime.anime_format,
            genres: editingAnime.anime_genres,
            episodes: editingAnime.anime_total_episodes,
            season: editingAnime.anime_season,
            seasonYear: editingAnime.anime_season_year,
            averageScore: editingAnime.anime_average_score,
          }}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAnime(null);
          }}
          onEntryUpdated={(updated) => {
            if (updated.deleted) {
              setLibrary((prev) => prev.filter((item) => item.id !== updated.id));
            } else {
              setLibrary((prev) =>
                prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
              );
            }
          }}
        />
      )}

      {/* Modal: Anime Details (Full synopsis, trailers, studios) */}
      {detailModalAnime && (
        <AnimeDetailModal
          anime={detailModalAnime}
          onClose={() => setDetailModalAnime(null)}
        />
      )}
    </div>
  );
}
