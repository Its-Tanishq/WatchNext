"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { fetchUserLibrary } from "@/utils/library";
import AnimeCard from "./AnimeCard";
import { getAnimeTitle } from "@/utils/anilist";
import { Sparkles, Library, RefreshCw, Compass, ArrowRight, UserPlus, Flame } from "lucide-react";

export default function WatchlistRecommendations({ onSelectAnime }) {
  const [user, setUser] = useState(null);
  const [library, setLibrary] = useState([]);
  const [seedsData, setSeedsData] = useState([]);
  const [combinedRecs, setCombinedRecs] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL" or seed anime ID
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Pick candidate seed anime from user's library
  const candidateSeeds = useMemo(() => {
    if (!library || library.length === 0) return [];

    // Prioritize favourites, completed, and currently watching
    const sorted = [...library].sort((a, b) => {
      if (a.is_favourite && !b.is_favourite) return -1;
      if (!a.is_favourite && b.is_favourite) return 1;
      if (a.user_score && b.user_score) return b.user_score - a.user_score;
      if (a.status === "COMPLETED" && b.status !== "COMPLETED") return -1;
      if (a.status !== "COMPLETED" && b.status === "COMPLETED") return 1;
      if (a.status === "CURRENT" && b.status !== "CURRENT") return -1;
      if (a.status !== "CURRENT" && b.status === "CURRENT") return 1;
      return 0;
    });

    return sorted;
  }, [library]);

  // Fetch recommendations from API based on seed IDs
  const loadRecommendations = useCallback(
    async (seedList, allLibraryItems) => {
      try {
        setIsRefreshing(true);
        const seedIds = (seedList || []).map((s) => s.anime_id);
        const excludeIds = (allLibraryItems || []).map((l) => l.anime_id);

        const res = await fetch("/api/anime/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seedIds, excludeIds }),
        });

        if (res.ok) {
          const data = await res.json();
          setSeedsData(data.seeds || []);
          setCombinedRecs(data.combined || []);
          setIsGuestMode(Boolean(data.isGuestMode));
          setActiveTab("ALL");
        }
      } catch (err) {
        console.error("Failed to load watchlist recommendations:", err);
      } finally {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    },
    []
  );

  // Shuffle seeds if user has multiple items
  const handleShuffleSeeds = () => {
    if (candidateSeeds.length <= 4) {
      // Just reload
      loadRecommendations(candidateSeeds.slice(0, 4), library);
      return;
    }

    // Pick 4 random seeds from candidates
    const shuffled = [...candidateSeeds].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, 4);
    loadRecommendations(picked, library);
  };

  // Initial user & library fetch
  useEffect(() => {
    let isCancelled = false;

    async function init() {
      setIsLoading(true);
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (isCancelled) return;
      setUser(currentUser);

      if (!currentUser) {
        // Guest mode: load default gateway recommendations
        setIsGuestMode(true);
        await loadRecommendations([], []);
        return;
      }

      const { data: libraryItems } = await fetchUserLibrary(supabase);
      if (isCancelled) return;

      const items = libraryItems || [];
      setLibrary(items);

      if (items.length === 0) {
        // User logged in but library empty
        setIsGuestMode(true);
        await loadRecommendations([], []);
      } else {
        // Pick top 4 seeds
        const sorted = [...items].sort((a, b) => {
          if (a.is_favourite && !b.is_favourite) return -1;
          if (!a.is_favourite && b.is_favourite) return 1;
          if (a.user_score && b.user_score) return b.user_score - a.user_score;
          if (a.status === "COMPLETED" && b.status !== "COMPLETED") return -1;
          if (a.status !== "COMPLETED" && b.status === "COMPLETED") return 1;
          return 0;
        });
        await loadRecommendations(sorted.slice(0, 4), items);
      }
    }

    init();

    return () => {
      isCancelled = true;
    };
  }, [loadRecommendations]);

  // Determine current active seed anime object (if activeTab is an ID)
  const activeSeedObj = useMemo(() => {
    if (activeTab === "ALL") return null;
    return seedsData.find((s) => String(s.id) === String(activeTab)) || null;
  }, [activeTab, seedsData]);

  // Active list of anime to display
  const displayedAnime = useMemo(() => {
    if (activeTab === "ALL") {
      return combinedRecs.slice(0, 14);
    }
    return (activeSeedObj?.recommendations || []).slice(0, 14);
  }, [activeTab, activeSeedObj, combinedRecs]);

  // If loading for the first time
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-[#161c29] rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-[#161c29] rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="aspect-[3/4.2] bg-[#111520] rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  // If no recommendations could be found at all
  if (!isLoading && seedsData.length === 0 && combinedRecs.length === 0) {
    return null;
  }

  return (
    <section id="for-you" className="space-y-5">
      {/* ================= HEADER & CONTROLS ================= */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#ff5238] tracking-widest uppercase flex items-center gap-1.5 bg-[#ff5238]/10 border border-[#ff5238]/20 px-2 py-0.5 rounded-md">
              <Sparkles className="w-3 h-3 text-[#ff5238]" />
              <span>{isGuestMode ? "Curated Gateway Picks" : "Based on Your Watchlist"}</span>
            </span>
            {!isGuestMode && library.length > 0 && (
              <span className="text-[10px] text-[#6a7896] hidden sm:inline">
                {library.length} anime in library
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1.5 flex items-center gap-2">
            {activeTab === "ALL" ? (
              <span>Recommended For You</span>
            ) : (
              <span>
                Because you watched{" "}
                <span className="text-[#ff5238]">
                  {getAnimeTitle(activeSeedObj?.title)}
                </span>
              </span>
            )}
          </h2>
          <p className="text-xs text-[#717f9d] mt-0.5">
            {activeTab === "ALL"
              ? isGuestMode
                ? "Top-rated gateway anime recommendations to start your journey"
                : "Handpicked anime tailored to your watched series and high ratings"
              : `Community-rated top recommendations for fans of ${getAnimeTitle(
                  activeSeedObj?.title
                )}`}
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {!isGuestMode && candidateSeeds.length > 1 && (
            <button
              type="button"
              onClick={handleShuffleSeeds}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-[#121622] border border-[#202738] hover:border-[#ff5238]/40 hover:text-white text-xs text-[#8c9bb8] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Shuffle recommendation seeds from your library"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#ff5238]" : ""}`} />
              <span className="hidden sm:inline">Shuffle Seeds</span>
            </button>
          )}

          {user ? (
            <Link
              href="/library"
              className="text-xs font-semibold text-[#8c9ab8] hover:text-[#ff5238] transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#121622] border border-[#202738]"
            >
              <Library className="w-3.5 h-3.5" />
              <span>My Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href="/signup"
              className="text-xs font-semibold bg-[#ff5238] hover:bg-[#ff6850] text-white px-3.5 py-1.5 rounded-xl shadow-md shadow-[#ff5238]/20 transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up to Track</span>
            </Link>
          )}
        </div>
      </div>

      {/* ================= GUEST / EMPTY LIBRARY CALLOUT BANNER ================= */}
      {isGuestMode && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#141926] via-[#101420] to-[#0d101a] border border-[#232c40] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#ff5238]/15 border border-[#ff5238]/30 flex items-center justify-center text-[#ff5238] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Want recommendations customized to your taste?</span>
                <span className="text-[10px] bg-[#ff5238]/20 text-[#ff715b] font-mono px-2 py-0.5 rounded border border-[#ff5238]/30">
                  Crunchyroll-Style AI
                </span>
              </h4>
              <p className="text-xs text-[#7e8ca8] mt-0.5 max-w-2xl leading-relaxed">
                Add anime you&apos;ve watched or plan to watch to your personal library. WatchNext analyzes your favorites to recommend high-match titles with direct streaming shortcuts!
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Link
              href={user ? "/library" : "/signup"}
              className="px-4 py-2 rounded-xl bg-[#ff5238] hover:bg-[#ff6850] text-white text-xs font-bold transition-all shadow-md shadow-[#ff5238]/25 flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{user ? "Open Watchlist" : "Create Free Watchlist"}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ================= SEED SWITCHER PILLS (CRUNCHYROLL STYLE) ================= */}
      {seedsData.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* All Combined Tab */}
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-white text-[#0a0d14] shadow-md shadow-white/10 scale-102"
                : "bg-[#111520] border border-[#202738] text-[#8e9cb9] hover:text-white hover:border-[#2f384e]"
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#ff5238]" />
            <span>All For You ({combinedRecs.length})</span>
          </button>

          {/* Individual Seed Anime Tabs */}
          {seedsData.map((seed) => {
            const isSelected = String(activeTab) === String(seed.id);
            const seedTitle = getAnimeTitle(seed.title);
            const recCount = seed.recommendations?.length || 0;

            return (
              <button
                key={seed.id}
                type="button"
                onClick={() => setActiveTab(String(seed.id))}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#ff5238] text-white shadow-md shadow-[#ff5238]/30 scale-102"
                    : "bg-[#111520] border border-[#202738] text-[#8e9cb9] hover:text-white hover:border-[#2f384e]"
                }`}
              >
                {seed.coverImage?.medium && (
                  <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 border border-white/20">
                    <Image
                      src={seed.coverImage.medium}
                      alt={seedTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <span>Because you liked: {seedTitle}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-black/30 text-white" : "bg-[#181f30] text-[#7180a0]"
                }`}>
                  {recCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ================= CARDS GRID ================= */}
      {displayedAnime.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
          {displayedAnime.map((anime, idx) => {
            // Curate intelligent match badge
            let badge = null;
            if (activeTab === "ALL") {
              if (idx === 0) badge = "TOP PICK";
              else if (anime.averageScore >= 85) badge = "98% MATCH";
              else if (anime.averageScore >= 80) badge = "HIGH MATCH";
              else if (idx === 1 || idx === 2) badge = "POPULAR";
            } else {
              if (idx === 0) badge = "BEST FIT";
              else if (idx === 1) badge = "SIMILAR";
            }

            return (
              <AnimeCard
                key={`${anime.id}-${activeTab}-${idx}`}
                anime={anime}
                rank={`#${idx + 1}`}
                badge={badge}
                onClick={onSelectAnime}
              />
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-[#0d1018] border border-[#1b2131] rounded-2xl">
          <p className="text-xs text-[#707f9d]">
            No recommendations found for this category yet.
          </p>
        </div>
      )}
    </section>
  );
}
