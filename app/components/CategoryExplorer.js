"use client";

import { useState, useEffect, useMemo } from "react";
import AnimeCard from "./AnimeCard";
import { formatReleaseDate } from "@/utils/anilist";
import { Calendar, Film, Snowflake, ArrowLeft } from "lucide-react";

const GENRES = [
  "All",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Romance",
  "Sci-Fi",
  "Supernatural",
  "Slice of Life",
];

const UPCOMING_STATUS_FILTERS = [
  { id: "all", label: "All Upcoming", icon: null },
  { id: "confirmed", label: "Confirmed Dates Only", icon: "dot" },
  { id: "winter2027", label: "Winter 2027", icon: "snow" },
  { id: "movies", label: "Movies & Theatrical", icon: "film" },
];

export default function CategoryExplorer({
  categoryKey, // 'trending' | 'top-rated' | 'upcoming' | 'seasonal'
  categoryTitle,
  categoryDescription,
  onBackToHome,
  onSelectAnime,
}) {
  const [mediaList, setMediaList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [upcomingFilter, setUpcomingFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch page 1 when categoryKey or selectedGenre changes
  useEffect(() => {
    let isCancelled = false;

    async function fetchFirstPage() {
      setIsLoading(true);
      setPage(1);
      try {
        const genreParam = selectedGenre !== "All" ? `&genre=${encodeURIComponent(selectedGenre)}` : "";
        const res = await fetch(
          `/api/anime/category?category=${categoryKey}&page=1&perPage=28${genreParam}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setMediaList(data.media || []);
            setHasNextPage(data.pageInfo?.hasNextPage || false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch category anime:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchFirstPage();

    return () => {
      isCancelled = true;
    };
  }, [categoryKey, selectedGenre]);

  // Load More Handler (Next Page)
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasNextPage) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    try {
      const genreParam = selectedGenre !== "All" ? `&genre=${encodeURIComponent(selectedGenre)}` : "";
      const res = await fetch(
        `/api/anime/category?category=${categoryKey}&page=${nextPage}&perPage=28${genreParam}`
      );
      if (res.ok) {
        const data = await res.json();
        setMediaList((prev) => [...prev, ...(data.media || [])]);
        setPage(nextPage);
        setHasNextPage(data.pageInfo?.hasNextPage || false);
      }
    } catch (err) {
      console.error("Failed to load more anime:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filtered Media list (for upcoming release status)
  const displayedMedia = useMemo(() => {
    if (categoryKey !== "upcoming" || upcomingFilter === "all") {
      return mediaList;
    }

    if (upcomingFilter === "confirmed") {
      return mediaList.filter((m) => {
        const rel = formatReleaseDate(m);
        return rel.type === "exact" || !!rel.countdown;
      });
    }

    if (upcomingFilter === "winter2027") {
      return mediaList.filter(
        (m) =>
          (m.season === "WINTER" && m.seasonYear === 2027) ||
          (m.startDate?.year === 2027 && m.startDate?.month <= 3)
      );
    }

    if (upcomingFilter === "movies") {
      return mediaList.filter((m) => m.format === "MOVIE");
    }

    return mediaList;
  }, [mediaList, categoryKey, upcomingFilter]);

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b2234]">
        <div>
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs text-[#8f9ebf] hover:text-[#ff5238] font-semibold mb-2 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Curated Home</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {categoryTitle}
          </h1>
          <p className="text-xs text-[#8291af] mt-1">{categoryDescription}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="bg-[#141824] border border-[#232b3d] text-white/90 text-xs px-3 py-1.5 rounded-xl font-medium">
            Showing <strong className="text-white">{displayedMedia.length}</strong> Titles
          </span>
        </div>
      </div>

      {/* Special Upcoming Release Date Filter Bar (Only for upcoming) */}
      {categoryKey === "upcoming" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none bg-[#0e121c] p-2.5 rounded-2xl border border-[#1f2638]">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider pr-1 shrink-0 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Release Status:</span>
          </span>
          {UPCOMING_STATUS_FILTERS.map((f) => {
            const isSelected = upcomingFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setUpcomingFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/25"
                    : "bg-[#141824] border border-[#252e42] text-[#8e9cb8] hover:text-white"
                }`}
              >
                {f.icon === "dot" && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                {f.icon === "snow" && <Snowflake className="w-3.5 h-3.5 text-blue-400" />}
                {f.icon === "film" && <Film className="w-3.5 h-3.5 text-amber-400" />}
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sub-Genre Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[11px] font-bold text-[#677594] uppercase tracking-wider pr-1 shrink-0">
          Filter Genre:
        </span>
        {GENRES.map((g) => {
          const isSelected = selectedGenre === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#ff5238] text-white font-semibold shadow-md shadow-[#ff5238]/25"
                  : "bg-[#10141f] border border-[#202638] text-[#8694b2] hover:text-white hover:border-[#2f394f]"
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4.2] bg-[#111520] border border-[#1b2130] rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : displayedMedia.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
          {displayedMedia.map((anime, idx) => (
            <AnimeCard
              key={`${anime.id}-${idx}`}
              anime={anime}
              rank={categoryKey === "top-rated" || categoryKey === "trending" ? `#${idx + 1}` : null}
              badge={
                categoryKey === "upcoming"
                  ? formatReleaseDate(anime).type === "exact"
                    ? "CONFIRMED"
                    : "UPCOMING"
                  : idx === 0
                  ? "HOT"
                  : idx === 1
                  ? "TOP"
                  : idx === 2
                  ? "POPULAR"
                  : null
              }
              onClick={onSelectAnime}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-[#0d1019] border border-[#1c2233] rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-white">No anime found matching your filter criteria.</p>
          <p className="text-xs text-[#707e9e]">
            Try choosing &quot;All&quot; genres or resetting the release status filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedGenre("All");
              setUpcomingFilter("all");
            }}
            className="text-xs bg-[#ff5238] text-white px-4 py-1.5 rounded-xl font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Load More Button */}
      {hasNextPage && !isLoading && (
        <div className="pt-6 pb-8 text-center">
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={handleLoadMore}
            className="bg-[#121623] hover:bg-[#1a2030] text-white font-semibold text-xs px-8 py-3 rounded-xl border border-[#252f44] hover:border-[#ff5238] shadow-xl inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#ff5238] border-t-transparent rounded-full animate-spin"></div>
                <span>Loading more titles from AniList...</span>
              </>
            ) : (
              <>
                <span>Load More Anime (+28)</span>
                <span className="text-xs">↓</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
