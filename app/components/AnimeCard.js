"use client";

import Image from "next/image";
import { formatScore, getAnimeTitle, formatReleaseDate } from "@/utils/anilist";
import { getStreamingLinks } from "@/utils/streaming";
import { Calendar, Clock, Star, ExternalLink } from "lucide-react";

export default function AnimeCard({ anime, rank, badge, onClick }) {
  if (!anime) return null;

  const links = getStreamingLinks(anime);
  const title = getAnimeTitle(anime.title);
  const score = formatScore(anime.averageScore);
  const isUpcoming = anime.status === "NOT_YET_RELEASED";
  const releaseInfo = formatReleaseDate(anime);

  const cover =
    anime.coverImage?.extraLarge ||
    anime.coverImage?.large ||
    anime.coverImage?.medium ||
    "/images/hero-art.jpg";
  const studio = anime.studios?.nodes?.[0]?.name || anime.format || "Anime";
  const epText = anime.episodes ? `${anime.episodes} eps` : anime.status === "RELEASING" ? "Airing" : "TBD";
  const yearText = anime.seasonYear || anime.startDate?.year || "";

  return (
    <div
      onClick={() => onClick && onClick(anime)}
      className="group relative rounded-2xl overflow-hidden bg-[#0e111a] border border-[#1e2434] hover:border-[#ff5238]/60 hover:shadow-xl hover:shadow-[#ff5238]/10 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Poster Image */}
      <div className="relative aspect-[3/4.2] w-full overflow-hidden bg-[#161a26]">
        <Image
          src={cover}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 14vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e111a] via-black/20 to-transparent"></div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
          {isUpcoming ? (
            <span className={`backdrop-blur-md border text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1.5 ${
              releaseInfo.type === "exact"
                 ? "bg-emerald-950/85 border-emerald-500/40 text-emerald-400"
                 : releaseInfo.type === "season" || releaseInfo.type === "month"
                 ? "bg-cyan-950/85 border-cyan-500/40 text-cyan-300"
                 : "bg-black/80 border-white/10 text-white/70"
            }`}>
              {releaseInfo.type === "exact" ? (
                <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <Clock className="w-3 h-3 text-cyan-300 shrink-0" />
              )}
              <span>{releaseInfo.countdown || releaseInfo.label}</span>
            </span>
          ) : score !== "N/A" ? (
            <span className="bg-[#0b0e16]/85 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
              <span>{score}</span>
            </span>
          ) : (
            <span></span>
          )}

          {badge && (
            <span className="bg-[#ff5238] text-white text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded shadow-sm">
              {badge}
            </span>
          )}
        </div>

        {/* Bottom Rank */}
        {rank && (
          <span className="absolute bottom-1.5 left-2 text-2xl font-black text-white/90 drop-shadow-md">
            {rank}
          </span>
        )}

        {/* Quick Hover Stream Options */}
        <div className="absolute inset-x-2 bottom-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1.5 backdrop-blur-md bg-black/90 p-1.5 rounded-xl border border-white/20 shadow-2xl">
          <a
            href={links.crunchyroll.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 py-1 bg-[#f47521] hover:bg-[#ff8533] text-white text-[10px] font-black rounded-lg text-center transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1"
            title="Watch on Crunchyroll (Official)"
          >
            <span>CR</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href={links.hianime.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 py-1 bg-[#5c67f5] hover:bg-[#727dff] text-white text-[10px] font-black rounded-lg text-center transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1"
            title="Watch Free on HiAnime"
          >
            <span>HiAnime</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Details */}
      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <h3 className="text-xs font-bold text-white truncate leading-tight group-hover:text-[#ff5238] transition-colors" title={title}>
          {title}
        </h3>
        <div className="mt-1 text-[10px] text-[#717f9e]">
          {isUpcoming ? (
            <>
              <p className="truncate font-medium text-emerald-400">
                {releaseInfo.type === "exact" ? `Confirmed: ${releaseInfo.label}` : releaseInfo.label}
              </p>
              <p className="truncate text-[#596683]">
                {anime.format || "TV"} • {studio}
              </p>
            </>
          ) : (
            <>
              <p className="truncate">
                {yearText ? `${yearText} • ` : ""}{anime.format || "TV"}
              </p>
              <p className="truncate text-[#596683]">
                {epText} • {studio}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
