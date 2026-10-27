"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { formatScore, getAnimeTitle, getWeekDays } from "@/utils/anilist";

export default function ScheduleExplorer({ onBackToHome, onSelectAnime }) {
  // Dynamically calculate the real 7 days of this week (Mon-Sun)
  const weekDays = useMemo(() => getWeekDays(), []);
  
  // Default to today's offset
  const todayItem = weekDays.find((d) => d.isToday) || weekDays[0];
  const [dayOffset, setDayOffset] = useState(todayItem.offset);
  const [scheduleList, setScheduleList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState("time"); // "time" or "popularity"

  const activeDayObj = weekDays.find((d) => d.offset === dayOffset) || weekDays[0];

  useEffect(() => {
    let isCancelled = false;

    async function loadSchedule() {
      setIsLoading(true);
      try {
        // Fetch full 50+ schedule items for that day
        const res = await fetch(`/api/anime/schedule?dayOffset=${dayOffset}&perPage=60`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setScheduleList(data.schedule || []);
          }
        }
      } catch (err) {
        console.error("Schedule error:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadSchedule();

    return () => {
      isCancelled = true;
    };
  }, [dayOffset]);

  const formatAiringTime = (timestamp) => {
    if (!timestamp) return "TBD";
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatCountdown = (timeUntil) => {
    if (timeUntil <= 0) return "Airing Now";
    const hours = Math.floor(timeUntil / 3600);
    const mins = Math.floor((timeUntil % 3600) / 60);
    if (hours > 24) {
      const d = Math.floor(hours / 24);
      return `In ${d}d ${hours % 24}h`;
    }
    if (hours > 0) return `In ${hours}h ${mins}m`;
    return `In ${mins}m`;
  };

  // Filter & Sort schedule items
  const filteredSchedule = useMemo(() => {
    let list = [...scheduleList];

    // Filter by search term
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase().trim();
      list = list.filter((item) => {
        const titleEng = item.media?.title?.english?.toLowerCase() || "";
        const titleRom = item.media?.title?.romaji?.toLowerCase() || "";
        const genres = (item.media?.genres || []).join(" ").toLowerCase();
        return titleEng.includes(query) || titleRom.includes(query) || genres.includes(query);
      });
    }

    // Sort by Popularity or Airing Time
    if (sortBy === "popularity") {
      list.sort((a, b) => (b.media?.popularity || 0) - (a.media?.popularity || 0));
    } else {
      list.sort((a, b) => a.airingAt - b.airingAt);
    }

    return list;
  }, [scheduleList, searchFilter, sortBy]);

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
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Curated Home</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Weekly Airing Schedule
          </h1>
          <p className="text-xs text-[#8291af] mt-1">
            Real-time Japanese anime broadcasts synced to your local device timezone.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live JST Sync</span>
          </span>
          <span className="bg-[#141824] border border-[#232b3d] text-white/90 text-xs px-3 py-1.5 rounded-xl font-medium">
            {scheduleList.length} Broadcasts Scheduled
          </span>
        </div>
      </div>

      {/* Weekday Switcher Tabs (Calculated from Real Calendar) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {weekDays.map((d) => {
          const isSelected = dayOffset === d.offset;
          return (
            <button
              key={d.offset}
              type="button"
              onClick={() => {
                setDayOffset(d.offset);
                setSearchFilter("");
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex flex-col items-center min-w-[90px] ${
                isSelected
                  ? "bg-[#ff5238] text-white shadow-lg shadow-[#ff5238]/30 scale-105"
                  : "bg-[#111520] border border-[#212738] text-[#8695b3] hover:text-white hover:border-[#323d57]"
              }`}
            >
              <div className="flex items-center gap-1">
                <span>{d.label}</span>
                {d.isToday && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-white text-[#ff5238]" : "bg-[#ff5238] text-white"}`}>
                    TODAY
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-normal ${isSelected ? "text-white/80" : "text-[#5e6c88]"}`}>
                {d.dateFormatted}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls Bar: Search inside schedule + Sort Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1019] border border-[#1d2334] p-3 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={`Filter ${activeDayObj.label}'s anime (e.g. Black Clover, Overgeared)...`}
            className="w-full bg-[#131724] border border-[#242b3d] focus:border-[#ff5238] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#5b6885] outline-none transition-all"
          />
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5e6b88]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchFilter && (
            <button
              onClick={() => setSearchFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#717e9c] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Toggle */}
        <div className="flex items-center gap-1.5 text-xs text-[#7c8aa6]">
          <span className="font-semibold text-[11px] pr-1">Sort:</span>
          <button
            type="button"
            onClick={() => setSortBy("time")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              sortBy === "time" ? "bg-[#181f30] text-white border border-[#2c3750]" : "hover:text-white"
            }`}
          >
            Broadcast Time
          </button>
          <button
            type="button"
            onClick={() => setSortBy("popularity")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              sortBy === "popularity" ? "bg-[#181f30] text-white border border-[#2c3750]" : "hover:text-white"
            }`}
          >
            Top Popular
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-[#101420] border border-[#1b2234] rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : filteredSchedule.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSchedule.map((item) => {
            const media = item.media;
            const title = getAnimeTitle(media?.title);
            const score = formatScore(media?.averageScore);
            const isLive = item.timeUntilAiring <= 0;

            return (
              <div
                key={item.id}
                onClick={() => onSelectAnime && onSelectAnime(media)}
                className="bg-[#0e121c] border border-[#1e2538] hover:border-[#ff5238]/60 hover:shadow-xl hover:shadow-[#ff5238]/10 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all cursor-pointer group"
              >
                {/* Top Time & Countdown Pill */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-black text-white">
                      {formatAiringTime(item.airingAt)}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                      isLive
                        ? "bg-red-500/15 border-red-500/40 text-red-400"
                        : "bg-[#171c2b] border-[#293247] text-[#a4b2cf]"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isLive ? "bg-red-400 animate-pulse" : "bg-emerald-400"
                      }`}
                    ></span>
                    {formatCountdown(item.timeUntilAiring)}
                  </span>
                </div>

                {/* Thumbnail & Title */}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-20 rounded-xl overflow-hidden shrink-0 bg-[#171c29]">
                    <Image
                      src={media?.coverImage?.large || media?.coverImage?.medium || "/images/hero-art.jpg"}
                      alt={title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-white truncate leading-tight group-hover:text-[#ff5238] transition-colors" title={title}>
                      {title}
                    </h3>
                    <p className="text-[11px] font-semibold text-[#ff5238] mt-0.5">
                      Episode {item.episode}
                    </p>
                    <p className="text-[10px] text-[#6d7b99] truncate mt-0.5">
                      {media?.genres?.slice(0, 2).join(" • ") || media?.format || "Anime"}
                    </p>
                    {media?.studios?.nodes?.[0]?.name && (
                      <p className="text-[10px] text-[#556480] truncate">
                        {media.studios.nodes[0].name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between pt-2 border-t border-[#182030] text-[10px]">
                  <span className="text-[#8795b5]">
                    {score !== "N/A" ? `★ ${score}` : media?.format || "TV"}
                  </span>
                  <span className="text-cyan-400 font-semibold group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-[#0d1019] border border-[#1c2233] rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-white">
            {searchFilter ? `No anime matching "${searchFilter}" on ${activeDayObj.label}.` : `No scheduled broadcasts found for ${activeDayObj.label}.`}
          </p>
          <p className="text-xs text-[#707e9e]">
            {searchFilter ? "Try clearing the search input." : "Try switching to another day of the week."}
          </p>
          {searchFilter && (
            <button
              onClick={() => setSearchFilter("")}
              className="text-xs bg-[#ff5238] text-white px-3 py-1 rounded-lg mt-2 cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
