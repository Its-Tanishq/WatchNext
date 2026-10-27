"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatScore, getAnimeTitle, formatReleaseDate } from "@/utils/anilist";
import { createClient } from "@/utils/supabase/client";
import { fetchSingleLibraryEntry, STATUS_MAP } from "@/utils/library";
import LibraryActionModal from "./LibraryActionModal";
import StatusIcon from "./StatusIcon";
import WatchOptions from "./WatchOptions";
import { X, Star, Plus, ArrowRight, Play } from "lucide-react";

export default function AnimeDetailModal({ anime, onClose }) {
  const [libraryEntry, setLibraryEntry] = useState(null);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  useEffect(() => {
    if (!anime?.id) return;
    const supabase = createClient();
    fetchSingleLibraryEntry(supabase, anime.id).then(({ data }) => {
      setLibraryEntry(data);
    });
  }, [anime?.id]);

  if (!anime) return null;

  const title = getAnimeTitle(anime.title);
  const score = formatScore(anime.averageScore);
  const cover = anime.coverImage?.extraLarge || anime.coverImage?.large || "/images/hero-art.jpg";
  const banner = anime.bannerImage || cover;
  const studio = anime.studios?.nodes?.[0]?.name || "Studio TBD";
  const trailerUrl = anime.trailer?.site === "youtube" ? `https://www.youtube.com/watch?v=${anime.trailer.id}` : null;
  const isUpcoming = anime.status === "NOT_YET_RELEASED";
  const releaseInfo = formatReleaseDate(anime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0d1019] border border-[#22293d] rounded-3xl shadow-2xl scrollbar-none text-[#e8ebf2]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with close button */}
        <div className="relative h-48 sm:h-64 w-full bg-[#151926] overflow-hidden">
          <Image
            src={banner}
            alt={title}
            fill
            className="object-cover brightness-65"
            sizes="(max-width: 768px) 100vw, 800px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1019] via-[#0d1019]/40 to-transparent"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Score or Premiere Badge */}
          {isUpcoming ? (
            <div className="absolute bottom-4 left-6 sm:left-8 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{releaseInfo.type === "exact" ? `Premiere: ${releaseInfo.label}` : releaseInfo.label}</span>
              {releaseInfo.countdown && (
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-bold">
                  {releaseInfo.countdown}
                </span>
              )}
            </div>
          ) : anime.averageScore ? (
            <div className="absolute bottom-4 left-6 sm:left-8 flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-[#ffb703]/30 text-[#ffb703] font-bold text-sm px-3 py-1 rounded-full shadow-lg">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-white">{score}</span>
              <span className="text-white/60 text-xs">/ 10</span>
            </div>
          ) : null}
        </div>

        {/* Content Container */}
        <div className="p-6 sm:p-8 space-y-5 -mt-6 relative z-10">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Poster thumbnail */}
            <div className="relative w-28 sm:w-36 aspect-[3/4.2] rounded-xl overflow-hidden border border-white/20 shadow-xl shrink-0 -mt-16 sm:-mt-20 bg-[#161a26]">
              <Image
                src={cover}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 112px, 144px"
              />
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-[#ff5238] text-white px-2.5 py-0.5 rounded-full">
                  {anime.format || "ANIME"}
                </span>
                {anime.status && (
                  <span className={`text-[10px] font-medium border px-2.5 py-0.5 rounded-full ${
                    isUpcoming
                      ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-400"
                      : "bg-[#1a2030] text-[#93a2c2] border-[#28324a]"
                  }`}>
                    {anime.status.replace(/_/g, " ")}
                  </span>
                )}
                {anime.seasonYear && (
                  <span className="text-[10px] font-medium text-[#7d8ba8]">
                    {anime.season} {anime.seasonYear}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {title}
              </h2>
              {anime.title?.native && anime.title.native !== title && (
                <p className="text-xs text-[#717e9b] font-medium">{anime.title.native}</p>
              )}

              <p className="text-xs text-cyan-400 font-medium">
                Studio: <span className="text-white font-semibold">{studio}</span>
                {anime.episodes && ` • ${anime.episodes} Episodes`}
                {anime.duration && ` • ~${anime.duration} min/ep`}
              </p>
            </div>
          </div>

          {/* Premiere Countdown Banner for Upcoming Anime */}
          {isUpcoming && (
            <div className="bg-gradient-to-r from-emerald-950/40 via-[#101924] to-[#121624] border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Confirmed Release Schedule
                </span>
                <p className="text-sm font-bold text-white">
                  {releaseInfo.type === "exact"
                    ? `Official Premiere: ${releaseInfo.label}`
                    : `Broadcast Window: ${releaseInfo.label}`}
                </p>
              </div>

              {releaseInfo.countdown && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 shrink-0">
                  <span>⏳</span>
                  <span>Premiere {releaseInfo.countdown}</span>
                </div>
              )}
            </div>
          )}

          {/* Genres Chips */}
          {anime.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {anime.genres.map((g) => (
                <span
                  key={g}
                  className="text-[11px] bg-[#141926] border border-[#242c40] text-[#91a0bf] px-3 py-1 rounded-lg"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {anime.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider text-[#8290ae]">Synopsis</h3>
              <p className="text-xs sm:text-sm text-[#b0bcd6] leading-relaxed max-h-48 overflow-y-auto pr-2 scrollbar-none">
                {anime.description.replace(/<[^>]*>?/gm, "")}
              </p>
            </div>
          )}

          {/* Where to Watch: Crunchyroll (Official) & HiAnime (Free) */}
          <div className="pt-2 border-t border-[#1b2234]">
            <WatchOptions anime={anime} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#1b2234]">
            <button
              type="button"
              onClick={() => setShowLibraryModal(true)}
              className={`font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                libraryEntry
                  ? "bg-[#182032] border border-[#2d3a54] text-white hover:bg-[#202a42]"
                  : "bg-gradient-to-r from-[#ff5238] to-[#ea3a22] hover:from-[#ff674f] hover:to-[#f24730] text-white shadow-[#ff5238]/25"
              }`}
            >
              {libraryEntry ? (
                <StatusIcon status={libraryEntry.status} className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>
                {libraryEntry
                  ? `${STATUS_MAP[libraryEntry.status]?.label || "In Library"}${libraryEntry.episodes_watched ? ` (${libraryEntry.episodes_watched} eps)` : ""}`
                  : "Add to Library"}
              </span>
            </button>

            <Link
              href={`/anime/${anime.id}`}
              className="bg-white text-black hover:bg-white/90 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md"
            >
              <span>Full Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {trailerUrl && (
              <a
                href={trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#171c2a] hover:bg-[#20273a] text-white font-semibold text-xs px-4 py-2.5 rounded-xl border border-[#2a344c] flex items-center gap-2 transition-colors"
              >
                <Play className="w-3 h-3 text-red-500 fill-red-500" />
                <span>Watch Trailer</span>
              </a>
            )}

            <button
              onClick={onClose}
              type="button"
              className="ml-auto text-xs text-[#7f8da8] hover:text-white px-3 py-2 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showLibraryModal && (
        <LibraryActionModal
          anime={anime}
          isOpen={showLibraryModal}
          onClose={() => setShowLibraryModal(false)}
          onEntryUpdated={(entry) => {
            if (entry.deleted) setLibraryEntry(null);
            else setLibraryEntry(entry);
          }}
        />
      )}
    </div>
  );
}
