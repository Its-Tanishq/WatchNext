"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatScore, getAnimeTitle, formatReleaseDate } from "@/utils/anilist";
import { createClient } from "@/utils/supabase/client";
import { fetchSingleLibraryEntry, upsertAnimeToLibrary, updateLibraryEntry } from "@/utils/library";
import LibraryActionModal from "@/app/components/LibraryActionModal";
import WatchOptions from "@/app/components/WatchOptions";
import {
  Share2,
  Check,
  ArrowLeft,
  Settings,
  Repeat,
  Tv,
  Star,
  Heart,
  Trophy,
  Play,
  Plus,
  Minus,
} from "lucide-react";

export default function AnimeDetailsView({ anime }) {
  const id = anime.id;
  const [libraryEntry, setLibraryEntry] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "relations" | "trailer"
  const [showShareToast, setShowShareToast] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  // Load user watch status from Supabase on mount
  useEffect(() => {
    if (!id) return;
    const supabase = createClient();
    fetchSingleLibraryEntry(supabase, id).then(({ data }) => {
      if (data) {
        setLibraryEntry(data);
      } else {
        // Fallback to localStorage if any
        const storedStatus = localStorage.getItem(`watchnext_status_${id}`);
        if (storedStatus) {
          const statusKey = storedStatus === "Watching" ? "CURRENT" :
                            storedStatus === "Completed" ? "COMPLETED" :
                            storedStatus === "On Hold" ? "PAUSED" :
                            storedStatus === "Dropped" ? "DROPPED" : "PLANNING";
          setLibraryEntry({ status: statusKey, episodes_watched: 0, rewatch_counter: 0, is_favourite: false, custom_lists: [] });
        }
      }
    });
  }, [id]);

  // Update Status in Supabase DB
  const handleStatusChange = async (statusCode) => {
    setStatusSaving(true);
    const supabase = createClient();
    const isCompleted = statusCode === "COMPLETED";
    const totalEp = anime.episodes || anime.anime_total_episodes || null;

    const updates = {
      status: statusCode,
      is_favourite: libraryEntry?.is_favourite ?? false,
      episodes_watched: isCompleted && totalEp ? totalEp : (libraryEntry?.episodes_watched || 0),
      rewatch_counter: libraryEntry?.rewatch_counter || 0,
      custom_lists: libraryEntry?.custom_lists || [],
      user_score: libraryEntry?.user_score,
      user_notes: libraryEntry?.user_notes || "",
    };

    setLibraryEntry((prev) => ({ ...(prev || {}), ...updates }));
    await upsertAnimeToLibrary(supabase, anime, updates);
    setStatusSaving(false);
  };

  const handleQuickEpisodes = async (delta) => {
    if (!libraryEntry) {
      await handleStatusChange("CURRENT");
    }
    const current = libraryEntry?.episodes_watched || 0;
    const max = anime.episodes || null;
    const next = Math.max(0, current + delta);
    if (max && next > max) return;

    const nextStatus = max && next >= max ? "COMPLETED" : (libraryEntry?.status === "PLANNING" ? "CURRENT" : libraryEntry?.status || "CURRENT");
    const updates = { episodes_watched: next, status: nextStatus };

    setLibraryEntry((prev) => ({ ...(prev || {}), ...updates }));
    const supabase = createClient();
    await upsertAnimeToLibrary(supabase, anime, {
      ...(libraryEntry || {}),
      ...updates,
    });
  };

  // Copy share URL
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    }
  };

  const title = getAnimeTitle(anime.title);
  const score = formatScore(anime.averageScore);
  const meanScore = anime.meanScore ? (anime.meanScore / 10).toFixed(1) : null;
  const cover = anime.coverImage?.extraLarge || anime.coverImage?.large || "/images/hero-art.jpg";
  const banner = anime.bannerImage || cover;
  const releaseInfo = formatReleaseDate(anime);
  const totalEpisodes = anime.episodes || null;

  // Separate animation studio vs producers
  const mainStudio = anime.studios?.edges?.find((e) => e.isMain)?.node?.name || "Studio TBD";
  const producers = anime.studios?.edges?.filter((e) => !e.isMain).map((e) => e.node.name) || [];

  // YouTube trailer URL
  const youtubeTrailer = anime.trailer?.site === "youtube" ? `https://www.youtube.com/embed/${anime.trailer.id}?autoplay=0` : null;

  return (
    <div className="min-h-screen bg-[#07090e] text-[#e8ebf2] font-sans selection:bg-[#ff5238] selection:text-white pb-24">
      {/* Toast Notification */}
      {showShareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161d2c] border border-emerald-500/50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Link copied to clipboard!</span>
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

            <Link href="/" className="hidden sm:flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff5b42] to-[#f03b24] flex items-center justify-center font-black text-white text-sm">
                W
              </div>
              <span className="font-bold tracking-widest text-sm text-white">WATCHNEXT</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="text-xs bg-[#121622] hover:bg-[#1b2234] border border-[#252f44] hover:border-[#ff5238] text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO PANORAMIC BANNER ================= */}
      <div className="relative w-full h-[280px] sm:h-[400px] overflow-hidden bg-[#0d1019]">
        <Image
          src={banner}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center brightness-60 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/70 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#07090e]/60 to-transparent"></div>
      </div>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 -mt-36 sm:-mt-52 relative z-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ================= LEFT COLUMN: POSTER & QUICK METRICS ================= */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            {/* Poster Card */}
            <div className="relative aspect-[3/4.4] w-full max-w-[300px] mx-auto lg:max-w-none rounded-2xl overflow-hidden border-2 border-white/15 shadow-2xl bg-[#121624] group">
              <Image
                src={cover}
                alt={title}
                fill
                priority
                sizes="(max-width: 1024px) 300px, 320px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              
              {/* Floating Status Tag */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-bold">
                <span className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-white">
                  {anime.format || "TV"}
                </span>
                <span className={`px-2.5 py-1 rounded-lg backdrop-blur-md border ${
                  anime.status === "RELEASING"
                    ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-400"
                    : anime.status === "NOT_YET_RELEASED"
                    ? "bg-cyan-950/80 border-cyan-500/40 text-cyan-400"
                    : "bg-black/80 border-white/10 text-[#8fa0c2]"
                }`}>
                  {anime.status ? anime.status.replace(/_/g, " ") : "FINISHED"}
                </span>
              </div>
            </div>

            {/* Direct Stream: Crunchyroll (Official) & HiAnime (Free) */}
            <div className="bg-[#0e121d] border border-[#20283a] rounded-2xl p-4 shadow-xl">
              <WatchOptions anime={anime} />
            </div>

            {/* Watchlist Manager Card */}
            <div className="bg-[#0e121d] border border-[#20283a] rounded-2xl p-4 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7988a8]">
                  Personal Library Status
                </label>
                <button
                  type="button"
                  onClick={() => setShowLibraryModal(true)}
                  className="text-[11px] text-[#ff5238] hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Full Edit</span>
                  <Settings className="w-3 h-3" />
                </button>
              </div>

              {/* Status Selector Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {[
                  { code: "CURRENT", label: "Watching" },
                  { code: "PLANNING", label: "Plan to Watch" },
                  { code: "COMPLETED", label: "Completed" },
                  { code: "PAUSED", label: "On Hold" },
                  { code: "DROPPED", label: "Dropped" },
                ].map(({ code, label }) => {
                  const isSelected = (libraryEntry?.status || "PLANNING") === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleStatusChange(code)}
                      disabled={statusSaving}
                      className={`px-3 py-2 rounded-xl text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#ff5238] text-white shadow-md shadow-[#ff5238]/30 font-bold"
                          : "bg-[#141824] border border-[#252f44] text-[#8695b3] hover:text-white hover:bg-[#1a2030]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Quick Episodes & Favourites bar */}
              <div className="pt-2 border-t border-[#192132] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#7181a1] uppercase block font-bold">Progress</span>
                  <div className="flex items-center gap-1.5 mt-0.5 font-bold text-white">
                    <span>{libraryEntry?.episodes_watched || 0}</span>
                    <span className="text-[#556482]">/ {totalEpisodes || "?"} eps</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickEpisodes(-1)}
                    className="w-7 h-7 rounded-lg bg-[#151a28] hover:bg-[#20293d] border border-[#252f44] text-white font-bold flex items-center justify-center cursor-pointer"
                    title="Watched -1 episode"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickEpisodes(1)}
                    className="w-7 h-7 rounded-lg bg-[#ff5238] hover:bg-[#ff6850] text-white font-bold flex items-center justify-center cursor-pointer shadow-md shadow-[#ff5238]/25"
                    title="Watched +1 episode"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Rewatches and Custom Lists preview */}
              {((libraryEntry?.rewatch_counter || 0) > 0 || (libraryEntry?.custom_lists?.length || 0) > 0) && (
                <div className="pt-2 border-t border-[#192132] space-y-1 text-[11px]">
                  {libraryEntry?.rewatch_counter > 0 && (
                    <p className="text-amber-400 font-semibold flex items-center gap-1">
                      <Repeat className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Rewatched {libraryEntry.rewatch_counter}x</span>
                    </p>
                  )}
                  {libraryEntry?.custom_lists?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {libraryEntry.custom_lists.map((c) => (
                        <span key={c} className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Metadata Box */}
            <div className="bg-[#0e121d] border border-[#20283a] rounded-2xl p-4 text-xs space-y-3 divide-y divide-[#182030]">
              <div className="flex justify-between items-center py-1">
                <span className="text-[#7888a7]">Studio</span>
                <span className="font-semibold text-white">{mainStudio}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#7888a7]">Episodes</span>
                <span className="font-semibold text-white">{totalEpisodes ? `${totalEpisodes} eps` : "Unknown"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#7888a7]">Duration</span>
                <span className="font-semibold text-white">{anime.duration ? `${anime.duration} mins/ep` : "24 mins"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#7888a7]">Season</span>
                <span className="font-semibold text-white">
                  {anime.season} {anime.seasonYear || ""}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#7888a7]">Release Date</span>
                <span className="font-semibold text-white">{releaseInfo.label}</span>
              </div>
              {producers.length > 0 && (
                <div className="py-2 space-y-1">
                  <span className="text-[#7888a7] block">Producers</span>
                  <p className="text-white font-medium leading-snug text-[11px]">
                    {producers.slice(0, 4).join(", ")}
                  </p>
                </div>
              )}
            </div>

            {/* Official Streaming Links */}
            {anime.externalLinks?.length > 0 && (
              <div className="bg-[#0e121d] border border-[#20283a] rounded-2xl p-4 space-y-2.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#7988a8] flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-[#7988a8]" />
                  <span>Official Streaming Platforms</span>
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {anime.externalLinks
                    .filter((l) => ["STREAMING", null].includes(l.type) || ["Crunchyroll", "Netflix", "Hulu", "YouTube", "Disney+", "Bilibili"].includes(l.site))
                    .slice(0, 6)
                    .map((link) => (
                      <a
                        key={link.id || link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#141825] hover:bg-[#ff5238] text-white hover:text-white border border-[#252f44] text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Play className="w-2.5 h-2.5 text-white fill-white" />
                        <span>{link.site}</span>
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* ================= RIGHT COLUMN: CORE SHOWCASE & INTERACTIVE TABS ================= */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-7">
            {/* Title & Community Metrics Banner */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {score !== "N/A" && (
                  <span className="bg-[#ffb703]/15 border border-[#ffb703]/30 text-[#ffb703] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{score}</span>
                    <span className="text-[#ffb703]/70 font-normal text-[10px]">/ 10</span>
                  </span>
                )}
                {meanScore && (
                  <span className="bg-[#141824] border border-[#242f44] text-[#8e9cb8] px-2.5 py-1 rounded-full text-[11px]">
                    Mean Score: <strong className="text-white">{meanScore}</strong>
                  </span>
                )}
                {anime.favourites && (
                  <span className="bg-[#141824] border border-[#242f44] text-[#8e9cb8] px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1.5">
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    <span>{anime.favourites.toLocaleString()} Favourites</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {title}
              </h1>

              {anime.title?.native && (
                <p className="text-sm sm:text-base text-[#7c8aa6] font-medium">
                  {anime.title.native} {anime.title?.romaji && anime.title.romaji !== title ? `• ${anime.title.romaji}` : ""}
                </p>
              )}
            </div>

            {/* Hall of Fame Rankings Badges */}
            {anime.rankings?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anime.rankings.slice(0, 3).map((r) => (
                  <span
                    key={r.id}
                    className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 text-amber-300 text-xs font-semibold px-3 py-1 rounded-xl flex items-center gap-1.5"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      #{r.rank} {r.context}
                    </span>
                  </span>
                ))}
              </div>
            )}



            {/* Interactive Section Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-[#1b2234] pb-3">
              {[
                { id: "overview", label: "Overview & Story" },
                { id: "trailer", label: "Official Trailer" },
                { id: "relations", label: `Franchise & Relations (${anime.relations?.edges?.length || 0})` },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-[#0a0d14] shadow-md shadow-white/10"
                        : "text-[#8796b4] hover:text-white hover:bg-[#121622]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: OVERVIEW & STORY */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-fadeIn">
                {/* Synopsis */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#7988a8]">Synopsis</h3>
                  <p className="text-sm sm:text-base text-[#b2c0dc] leading-relaxed whitespace-pre-line">
                    {anime.description ? anime.description.replace(/<[^>]*>?/gm, "") : "No synopsis provided."}
                  </p>
                </div>

                {/* Genres */}
                {anime.genres?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#7988a8]">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {anime.genres.map((g) => (
                        <span
                          key={g}
                          className="bg-[#141825] border border-[#252f44] text-[#93a2c2] text-xs font-medium px-3.5 py-1.5 rounded-xl"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Community Tags / Themes */}
                {anime.tags?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#7988a8]">Themes & Community Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {anime.tags.slice(0, 12).map((tag) => (
                        <span
                          key={tag.id || tag.name}
                          className="bg-[#111520] border border-[#1f2638] text-[#7d8ca9] text-[11px] px-3 py-1 rounded-lg flex items-center gap-1.5"
                        >
                          <span>{tag.name}</span>
                          <span className="text-[#ff5238] font-semibold">{tag.rank}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TRAILER */}
            {activeTab === "trailer" && (
              <div className="space-y-4 animate-fadeIn">
                {youtubeTrailer ? (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[#20283a] bg-black shadow-2xl">
                    <iframe
                      src={youtubeTrailer}
                      title={`${title} Trailer`}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    ></iframe>
                  </div>
                ) : (
                  <div className="py-20 text-center bg-[#0e121d] border border-[#1e2538] rounded-2xl space-y-2">
                    <p className="text-sm font-semibold text-white">No official video trailer available.</p>
                    <p className="text-xs text-[#707e9e]">AniList does not currently have an embedded trailer stream for this title.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: RELATIONS (PREQUELS, SEQUELS, SPIN-OFFS) */}
            {activeTab === "relations" && (
              <div className="space-y-4 animate-fadeIn">
                {anime.relations?.edges?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {anime.relations.edges.map((rel, idx) => {
                      const relMedia = rel.node;
                      const relTitle = getAnimeTitle(relMedia.title);
                      return (
                        <Link
                          key={idx}
                          href={`/anime/${relMedia.id}`}
                          className="bg-[#0e121d] border border-[#1f2638] hover:border-[#ff5238] rounded-xl p-3 flex items-center gap-3 transition-all group"
                        >
                          <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-[#161b28]">
                            <Image
                              src={relMedia.coverImage?.medium || "/images/hero-art.jpg"}
                              alt={relTitle}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-[#ff5238] uppercase tracking-wider block">
                              {rel.relationType?.replace(/_/g, " ")}
                            </span>
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-[#ff5238] transition-colors">
                              {relTitle}
                            </h4>
                            <p className="text-[10px] text-[#6d7b99] mt-0.5">
                              {relMedia.format || "ANIME"} • {relMedia.status?.replace(/_/g, " ") || "FINISHED"}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center bg-[#0e121d] border border-[#1e2538] rounded-2xl text-xs text-[#7282a1]">
                    No related franchise titles found for this anime.
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Section */}
            {anime.recommendations?.nodes?.length > 0 && (
              <div className="pt-8 space-y-4 border-t border-[#1b2234]">
                <h3 className="text-lg font-bold text-white">Recommended If You Liked This</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {anime.recommendations.nodes.slice(0, 7).map((rec, i) => {
                    const rMedia = rec.mediaRecommendation;
                    if (!rMedia) return null;
                    const rTitle = getAnimeTitle(rMedia.title);
                    return (
                      <Link
                        key={i}
                        href={`/anime/${rMedia.id}`}
                        className="bg-[#0e121d] border border-[#1e2538] hover:border-[#ff5238] rounded-xl overflow-hidden flex flex-col group transition-all"
                      >
                        <div className="relative aspect-[3/4.2] w-full bg-[#161c28]">
                          <Image
                            src={rMedia.coverImage?.large || rMedia.coverImage?.medium || "/images/hero-art.jpg"}
                            alt={rTitle}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          {rMedia.averageScore && (
                            <span className="absolute top-1.5 right-1.5 bg-black/75 text-[#ffb703] text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{formatScore(rMedia.averageScore)}</span>
                            </span>
                          )}
                        </div>
                        <div className="p-2">
                          <h4 className="text-[11px] font-bold text-white truncate group-hover:text-[#ff5238]" title={rTitle}>
                            {rTitle}
                          </h4>
                          <p className="text-[10px] text-[#6d7b99] mt-0.5">{rMedia.format || "TV"}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Library Action Modal */}
      {showLibraryModal && (
        <LibraryActionModal
          anime={anime}
          isOpen={showLibraryModal}
          onClose={() => setShowLibraryModal(false)}
          onEntryUpdated={(updated) => {
            if (updated.deleted) setLibraryEntry(null);
            else setLibraryEntry(updated);
          }}
        />
      )}
    </div>
  );
}
