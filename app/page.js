"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import AnimeCard from "./components/AnimeCard";
import AnimeDetailModal from "./components/AnimeDetailModal";
import CategoryExplorer from "./components/CategoryExplorer";
import ScheduleExplorer from "./components/ScheduleExplorer";
import WatchlistRecommendations from "./components/WatchlistRecommendations";
import { formatScore, getAnimeTitle, getWeekDays } from "@/utils/anilist";
import { Library, Star, Flame, Calendar, ArrowRight, X } from "lucide-react";

export default function HomePage() {
  // Navigation & Category States
  // activeCategory can be: "All", "Trending", "Top Rated", "Upcoming", "Seasonal", "Schedule"
  const [activeCategory, setActiveCategory] = useState("All");
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Curated Home Anime States
  const [trending, setTrending] = useState([]);
  const [seasonal, setSeasonal] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [seasonInfo, setSeasonInfo] = useState({ season: "CURRENT", seasonYear: 2026 });
  const [heroIndex, setHeroIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Anime for Detail Modal (opens on click anywhere)
  const [selectedAnime, setSelectedAnime] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);
  const searchCacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  // Curated Schedule Day State (Widget on Home)
  const [scheduleOffset, setScheduleOffset] = useState(0);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);

  // Supabase Auth listener
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setShowUserMenu(false);
  };

  // Fetch Curated Home Anime Data on Mount
  useEffect(() => {
    async function loadHomeAnime() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/anime/home");
        if (res.ok) {
          const data = await res.json();
          setTrending(data.trending || []);
          setSeasonal(data.seasonal || []);
          setTopRated(data.topRated || []);
          setUpcoming(data.upcoming || []);
          setSchedule(data.schedule || []);
          if (data.season && data.seasonYear) {
            setSeasonInfo({ season: data.season, seasonYear: data.seasonYear });
          }
        }
      } catch (err) {
        console.error("Failed to load anime data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHomeAnime();
  }, []);

  // Ultra-Fast Live Search with Memory Cache & Keystroke Cancellation
  useEffect(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      const resetTimer = setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    // 1. Instant 0ms response if query is in memory cache
    if (searchCacheRef.current.has(trimmed)) {
      setSearchResults(searchCacheRef.current.get(trimmed));
      setIsSearching(false);
      setShowSearchDropdown(true);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    // 2. Abort any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 3. Fast 180ms debounce for snappy feel
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/anime/search?q=${encodeURIComponent(trimmed)}&perPage=6`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];
          searchCacheRef.current.set(trimmed, results);
          setSearchResults(results);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Search fetch error:", err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic 7 days of the week (Monday to Sunday)
  const weekDays = useMemo(() => getWeekDays(), []);
  const todayItem = weekDays.find((d) => d.isToday) || weekDays[0];

  // Fetch Airing Schedule when Home Day widget changes
  const handleDaySelect = async (offset) => {
    setScheduleOffset(offset);
    setIsScheduleLoading(true);
    try {
      const res = await fetch(`/api/anime/schedule?dayOffset=${offset}&perPage=50`);
      if (res.ok) {
        const data = await res.json();
        setSchedule(data.schedule || []);
      }
    } catch (err) {
      console.error("Schedule error:", err);
    } finally {
      setIsScheduleLoading(false);
    }
  };

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
      const days = Math.floor(hours / 24);
      return `In ${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `In ${hours}h ${mins}m`;
    return `In ${mins}m`;
  };

  const categoryTabs = [
    { label: "All", id: "All" },
    { label: "Trending", id: "Trending" },
    { label: "Top Rated", id: "Top Rated" },
    { label: "Upcoming", id: "Upcoming" },
    { label: `${seasonInfo.season} ${seasonInfo.seasonYear}`, id: "Seasonal" },
    { label: "Schedule", id: "Schedule" },
  ];

  // Helper to switch category and scroll smoothly to top
  const switchCategory = (category) => {
    setActiveCategory(category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Active Hero Anime from top trending
  const heroAnime = trending[heroIndex] || trending[0] || null;
  const heroTitle = heroAnime ? getAnimeTitle(heroAnime.title) : "Loading featured...";
  const heroScore = heroAnime ? formatScore(heroAnime.averageScore) : "9.0";
  const heroCover = heroAnime?.bannerImage || heroAnime?.coverImage?.extraLarge || "/images/skywhale.jpg";
  const heroPoster = heroAnime?.coverImage?.extraLarge || heroAnime?.coverImage?.large || "/images/hero-art.jpg";
  const heroStudio = heroAnime?.studios?.nodes?.[0]?.name || "Anime Studio";
  const heroSynopsis = heroAnime?.description
    ? heroAnime.description.replace(/<[^>]*>?/gm, "")
    : "Experience premier storytelling, high-stakes animation, and acclaimed cinematic direction.";

  return (
    <div className="min-h-screen bg-[#07090e] text-[#e8ebf2] font-sans selection:bg-[#ff5238] selection:text-white pb-16">
      {/* ================= DETAIL MODAL ================= */}
      {selectedAnime && (
        <AnimeDetailModal
          anime={selectedAnime}
          onClose={() => setSelectedAnime(null)}
        />
      )}

      {/* ================= STICKY TOP NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-[#07090e]/95 backdrop-blur-md border-b border-[#181d2a]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              onClick={() => switchCategory("All")}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff5b42] to-[#f03b24] flex items-center justify-center shadow-lg shadow-[#ff5238]/25 group-hover:scale-105 transition-transform">
                <span className="font-extrabold text-white text-base tracking-wider">W</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold tracking-widest text-base text-white">WATCHNEXT</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff5238] ml-1 mt-0.5 inline-block"></span>
              </div>
            </Link>

            {/* Desktop Navigation Links (Unified Primary Category Mode) */}
            <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
              {[
                { name: "Home", cat: "All" },
                { name: "Trending", cat: "Trending" },
                { name: "Top Rated", cat: "Top Rated" },
                { name: "Seasonal", cat: "Seasonal" },
                { name: "Schedule", cat: "Schedule" },
                { name: "Upcoming", cat: "Upcoming" },
              ].map((tab) => {
                const isActive = activeCategory === tab.cat;
                return (
                  <button
                    key={tab.name}
                    onClick={() => switchCategory(tab.cat)}
                    className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer font-bold ${
                      isActive
                        ? "bg-white text-[#0a0d14] shadow-md shadow-white/15 scale-105"
                        : "text-[#8b98b5] hover:text-white hover:bg-[#121622]"
                    }`}
                  >
                    {tab.name}
                  </button>
                );
              })}

              <Link
                href="/library"
                className="ml-1 px-3.5 py-1.5 rounded-full font-bold bg-[#151a28] hover:bg-[#ff5238] border border-[#273248] hover:border-[#ff5238] text-[#ff6750] hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Library className="w-3.5 h-3.5" />
                <span>Library</span>
              </Link>
            </nav>
          </div>

          {/* Right: Search, Notification & Auth / Profile */}
          <div className="flex items-center gap-3">
            {/* Search Input Bar with Live Dropdown */}
            <div ref={searchRef} className="relative hidden sm:block w-64 lg:w-80">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchDropdown(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anime from AniList..."
                className="w-full bg-[#11141e] border border-[#212738] focus:border-[#ff5238] focus:ring-1 focus:ring-[#ff5238] rounded-xl pl-9 pr-10 py-1.5 text-xs text-white placeholder-[#505c77] outline-none transition-all"
              />
              <svg
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5e6b88]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {isSearching ? (
                <div className="w-3.5 h-3.5 border-2 border-[#ff5238] border-t-transparent rounded-full animate-spin absolute right-3 top-1/2 -translate-y-1/2"></div>
              ) : searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#717e9c] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#1a1f2e] border border-[#273047] text-[#6d7b9c] px-1.5 py-0.5 rounded font-mono">
                  ⌘K
                </span>
              )}

              {/* Instant Search Dropdown */}
              {showSearchDropdown && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#0e121c] border border-[#252e44] rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                  <div className="p-2 border-b border-[#1b2234] flex items-center justify-between text-[11px] text-[#7584a3] px-3">
                    <span>Results from AniList</span>
                    {searchResults.length > 0 && <span>{searchResults.length} found</span>}
                  </div>

                  {isSearching ? (
                    <div className="p-6 text-center text-xs text-[#707f9e]">
                      <div className="w-5 h-5 border-2 border-[#ff5238] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Searching AniList...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#171d2b]">
                      {searchResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedAnime(item);
                            setShowSearchDropdown(false);
                          }}
                          className="flex items-center gap-3 p-2.5 hover:bg-[#151b2a] cursor-pointer transition-colors"
                        >
                          <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-[#171c29]">
                            <Image
                              src={item.coverImage?.medium || item.coverImage?.large || "/images/hero-art.jpg"}
                              alt={getAnimeTitle(item.title)}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate hover:text-[#ff5238]">
                              {getAnimeTitle(item.title)}
                            </h4>
                            <p className="text-[10px] text-[#7583a2] mt-0.5 truncate">
                              {item.seasonYear ? `${item.seasonYear} • ` : ""}{item.format || "TV"}
                              {item.episodes ? ` • ${item.episodes} eps` : ""}
                            </p>
                          </div>
                          {item.averageScore && (
                            <span className="text-[10px] font-bold text-[#ffb703] bg-[#1a2030] px-2 py-0.5 rounded border border-[#2b354e] shrink-0 flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              <span>{formatScore(item.averageScore)}</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-[#72809f]">
                      No anime found for &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <button
              aria-label="Notifications"
              className="w-9 h-9 rounded-xl bg-[#11141e] border border-[#212738] text-[#8e9bb8] hover:text-white hover:border-[#2f384f] flex items-center justify-center transition-colors relative cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5238] absolute top-2 right-2"></span>
            </button>

            {/* User Profile Pill & Auth Links */}
            <div className="flex items-center gap-2 pl-1 relative">
              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 bg-[#11141e] border border-[#212738] hover:border-[#ff5238]/60 rounded-full pl-1 pr-3 py-1 cursor-pointer transition-all"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ff5238] to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      {(user.user_metadata?.username?.[0] || user.email?.[0] || "U").toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-white max-w-[90px] truncate hidden sm:inline">
                      {user.user_metadata?.username || user.email?.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-[#697796]">▾</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#10141f] border border-[#242b3e] rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn">
                      <div className="px-3.5 py-2 border-b border-[#1b2234]">
                        <p className="text-[11px] text-[#7886a3]">Signed in as</p>
                        <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/library"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#a0acc7] hover:text-white hover:bg-[#181f30] transition-colors"
                      >
                        <Library className="w-3.5 h-3.5" />
                        <span>Personal Anime Library</span>
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="text-xs font-semibold text-[#a2aec7] hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="text-xs font-semibold bg-[#ff5238] hover:bg-[#ff6850] text-white px-3.5 py-1.5 rounded-xl shadow-md shadow-[#ff5238]/25 transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-9">
        {/* ================= MOBILE-ONLY CATEGORY CHIPS (HIDDEN ON DESKTOP TO PREVENT DUPLICATION) ================= */}
        <section className="md:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categoryTabs.map((chip) => {
              const isSelected = activeCategory === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => switchCategory(chip.id)}
                  className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white text-[#0a0d14] shadow-md shadow-white/10 scale-105"
                      : "bg-[#11141e] border border-[#202636] text-[#8e9cb9] hover:text-white hover:border-[#2f384e]"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
            <Link
              href="/library"
              className="px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all bg-[#171d2b] border border-[#ff5238]/40 text-[#ff6750] flex items-center gap-1.5"
            >
              <Library className="w-3.5 h-3.5" />
              <span>Library</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-[#7e8ba8] shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-medium">AniList Live Synced • Real-Time GraphQL</span>
          </div>
        </section>

        {/* ================= DYNAMIC VIEW RENDERING ================= */}

        {/* 1. Dedicated Category View: Trending */}
        {activeCategory === "Trending" && (
          <CategoryExplorer
            categoryKey="trending"
            categoryTitle="Trending Anime Explorer"
            categoryDescription="Currently most-talked about and streamed anime series across global audiences."
            onBackToHome={() => switchCategory("All")}
            onSelectAnime={setSelectedAnime}
          />
        )}

        {/* 2. Dedicated Category View: Top Rated */}
        {activeCategory === "Top Rated" && (
          <CategoryExplorer
            categoryKey="top-rated"
            categoryTitle="All-Time Hall of Fame (Top Rated)"
            categoryDescription="The highest critically-acclaimed anime masterpieces ranked by community reviews."
            onBackToHome={() => switchCategory("All")}
            onSelectAnime={setSelectedAnime}
          />
        )}

        {/* 3. Dedicated Category View: Upcoming */}
        {activeCategory === "Upcoming" && (
          <CategoryExplorer
            categoryKey="upcoming"
            categoryTitle="Most Anticipated Upcoming Anime"
            categoryDescription="Upcoming releases, highly awaited sequels, and theatrical anime movies."
            onBackToHome={() => switchCategory("All")}
            onSelectAnime={setSelectedAnime}
          />
        )}

        {/* 4. Dedicated Category View: Seasonal */}
        {activeCategory === "Seasonal" && (
          <CategoryExplorer
            categoryKey="seasonal"
            categoryTitle={`${seasonInfo.season} ${seasonInfo.seasonYear} Seasonal Chart`}
            categoryDescription="Everything airing right now in this season's television and streaming lineup."
            onBackToHome={() => switchCategory("All")}
            onSelectAnime={setSelectedAnime}
          />
        )}

        {/* 5. Dedicated Category View: Full Weekly Schedule */}
        {activeCategory === "Schedule" && (
          <ScheduleExplorer
            onBackToHome={() => switchCategory("All")}
            onSelectAnime={setSelectedAnime}
          />
        )}

        {/* 6. Curated Home Dashboard (Rendered when activeCategory is "All") */}
        {activeCategory === "All" && (
          <>
            {/* ================= MASSIVE HERO FEATURED SHOWCASE ================= */}
            <section className="relative rounded-3xl overflow-hidden border border-[#202738] bg-[#0c0f17] shadow-2xl min-h-[380px]">
              {isLoading ? (
                <div className="p-8 sm:p-12 flex flex-col justify-center gap-4 animate-pulse">
                  <div className="h-6 w-32 bg-[#1b2234] rounded-full"></div>
                  <div className="h-12 w-3/4 max-w-xl bg-[#1b2234] rounded-xl"></div>
                  <div className="h-4 w-full max-w-lg bg-[#1b2234] rounded"></div>
                  <div className="h-4 w-2/3 max-w-md bg-[#1b2234] rounded"></div>
                </div>
              ) : heroAnime ? (
                <>
                  {/* Background Art */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={heroCover}
                      alt={heroTitle}
                      fill
                      priority
                      className="object-cover object-center brightness-60 scale-105"
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/75 to-[#0a0d14]/40"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14] via-[#0a0d14]/85 to-transparent"></div>
                  </div>

                  {/* Hero Content Grid */}
                  <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-center gap-8">
                    {/* Left Poster Thumbnail Card */}
                    <div
                      onClick={() => setSelectedAnime(heroAnime)}
                      className="relative w-44 sm:w-52 aspect-[3/4] rounded-2xl overflow-hidden border border-white/15 shadow-2xl shrink-0 group cursor-pointer"
                    >
                      <Image
                        src={heroPoster}
                        alt={heroTitle}
                        fill
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 176px, 208px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute bottom-3 left-3 right-3 text-center">
                        <span className="text-[11px] font-bold text-white tracking-widest uppercase bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                          {heroAnime.nextAiringEpisode ? `EP ${heroAnime.nextAiringEpisode.episode} Soon` : `${heroAnime.format || "TV"}`}
                        </span>
                      </div>
                    </div>

                    {/* Right Hero Details */}
                    <div className="flex-1 space-y-4 text-left">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="bg-[#ff5238] text-white px-3 py-1 rounded-full shadow-lg shadow-[#ff5238]/30 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5" />
                          <span>#{heroIndex + 1} Trending on AniList</span>
                        </span>
                        <span className="bg-[#141824]/80 backdrop-blur-md border border-[#2b3348] text-white/90 px-3 py-1 rounded-full">
                          {heroAnime.season} {heroAnime.seasonYear || ""} • {heroAnime.format || "TV"}
                          {heroAnime.episodes ? ` (${heroAnime.episodes} eps)` : ""}
                        </span>
                        {heroAnime.status === "RELEASING" && (
                          <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Airing Now
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none drop-shadow-md">
                        {heroTitle}
                      </h1>

                      {/* Description */}
                      <p className="max-w-2xl text-xs sm:text-sm text-[#aab6d1] leading-relaxed line-clamp-3">
                        {heroSynopsis}
                      </p>

                      {/* Metadata & Genres */}
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#95a3c2] pt-1">
                        <div className="flex items-center gap-1.5 text-[#ffb703] font-bold bg-[#151926] px-2.5 py-1 rounded-lg border border-[#252d42]">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-white">{heroScore}</span>
                          <span className="text-[#6d7994] font-normal">/ 10</span>
                        </div>
                        <span className="bg-[#151926] px-2.5 py-1 rounded-lg border border-[#252d42] text-white font-medium">
                          {heroStudio}
                        </span>
                        {heroAnime.genres?.slice(0, 3).map((genre) => (
                          <span key={genre} className="bg-[#151926] px-2.5 py-1 rounded-lg border border-[#252d42]">
                            {genre}
                          </span>
                        ))}
                      </div>

                      {/* Actions & Pagination */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/anime/${heroAnime.id}`}
                            className="bg-gradient-to-r from-[#ff5238] to-[#ea3a22] hover:from-[#ff674f] hover:to-[#f24730] text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-[#ff5238]/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>View Full Details</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => setSelectedAnime(heroAnime)}
                            className="bg-[#171b29]/80 hover:bg-[#202638] text-white font-medium text-sm px-4 py-2.5 rounded-xl border border-[#28324a] flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <span>+</span>
                            <span>Add to List</span>
                          </button>
                        </div>

                        {/* Pagination Pill Indicators */}
                        <div className="flex items-center gap-2 text-right">
                          <span className="text-[10px] text-[#707e9e] font-semibold tracking-wider uppercase hidden sm:inline">
                            TOP PICKS
                          </span>
                          <div className="flex items-center gap-1.5">
                            {[0, 1, 2].map((idx) => (
                              <button
                                key={idx}
                                onClick={() => setHeroIndex(idx)}
                                aria-label={`Hero item ${idx + 1}`}
                                className={`h-2 rounded-full transition-all cursor-pointer ${
                                  heroIndex === idx ? "w-6 bg-[#ff5238]" : "w-2 bg-white/20 hover:bg-white/40"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </section>

            {/* ================= WATCHLIST RECOMMENDATIONS (CRUNCHYROLL-STYLE) ================= */}
            <WatchlistRecommendations onSelectAnime={setSelectedAnime} />

            {/* ================= TRENDING NOW ================= */}
            <section id="trending" className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#ff5238] tracking-widest uppercase">
                    Real-Time AniList Popularity
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                    Trending Now
                  </h2>
                </div>
                {/* View All Button triggers Category Mode */}
                <button
                  type="button"
                  onClick={() => switchCategory("Trending")}
                  className="text-xs font-semibold text-[#8c9ab8] hover:text-[#ff5238] transition-colors cursor-pointer group flex items-center gap-1"
                >
                  <span>View all</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
                {isLoading
                  ? Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="aspect-[3/4.2] bg-[#111520] rounded-2xl animate-pulse"></div>
                    ))
                  : trending.slice(0, 14).map((anime, idx) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        rank={`#${idx + 1}`}
                        badge={idx === 0 ? "HOT" : idx === 1 ? "TOP" : idx === 2 ? "NEW" : null}
                        onClick={setSelectedAnime}
                      />
                    ))}
              </div>
            </section>

            {/* ================= AIRING SCHEDULE WIDGET ================= */}
            <section id="schedule" className="bg-[#0c0f17] border border-[#1e2434] rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row items-stretch gap-6">
                {/* Left Control Card */}
                <div className="lg:w-64 shrink-0 space-y-3">
                  <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                    Live Broadcasts
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">Airing Schedule</h2>

                  {/* Day Selector Pills (Mon to Sun) */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {weekDays.map((d) => {
                      const isActive = scheduleOffset === d.offset;
                      return (
                        <button
                          key={d.offset}
                          type="button"
                          onClick={() => handleDaySelect(d.offset)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#ff5238] text-white shadow-md shadow-[#ff5238]/30"
                              : "bg-[#141824] border border-[#232b3d] text-[#7c8aa6] hover:text-white"
                          }`}
                          title={`${d.label} (${d.dateFormatted})`}
                        >
                          {d.short}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => switchCategory("Schedule")}
                    className="inline-flex items-center gap-1.5 text-xs text-[#a2b0ce] hover:text-[#ff5238] font-semibold pt-2 cursor-pointer transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Full Weekly Calendar</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Right Schedule Items List */}
                <div className="flex-1">
                  {isScheduleLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 bg-[#131826] rounded-xl animate-pulse"></div>
                      ))}
                    </div>
                  ) : schedule.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {schedule.slice(0, 8).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => setSelectedAnime(item.media)}
                          className="bg-[#11141f] border border-[#212739] hover:border-[#323d57] rounded-xl p-3.5 space-y-2 flex flex-col justify-between transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-white font-bold">
                              {formatAiringTime(item.airingAt)}
                            </span>
                            <span className="text-[10px] font-semibold text-white/90 bg-[#191f2f] px-2 py-0.5 rounded-md border border-white/5 flex items-center gap-1">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.timeUntilAiring <= 0
                                    ? "bg-red-500 animate-pulse"
                                    : "bg-emerald-400"
                                }`}
                              ></span>
                              {formatCountdown(item.timeUntilAiring)}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-white truncate group-hover:text-[#ff5238] transition-colors">
                              {getAnimeTitle(item.media?.title)} EP {item.episode}
                            </h3>
                            <p className="text-[10px] text-[#717f9e] mt-0.5 truncate">
                              {item.media?.genres?.slice(0, 2).join(" • ") || item.media?.format || "Anime"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-[#8e9bb8]">
                              {item.media?.averageScore ? (
                                <span className="inline-flex items-center gap-1">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                                  <span>{formatScore(item.media.averageScore)}</span>
                                </span>
                              ) : (
                                ""
                              )}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-semibold group-hover:underline inline-flex items-center gap-1">
                              <span>View Show</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center p-8 text-center text-xs text-[#6e7d9b] bg-[#11141f] rounded-xl">
                      No scheduled anime broadcasts found for this day.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ================= SEASONAL CHART ================= */}
            <section id="seasonal" className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#ff5238] tracking-widest uppercase">
                    Seasonal Chart
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                    {seasonInfo.season} {seasonInfo.seasonYear} Seasonal Anime
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => switchCategory("Seasonal")}
                  className="text-xs font-semibold text-[#8c9ab8] hover:text-[#ff5238] transition-colors cursor-pointer group flex items-center gap-1"
                >
                  <span>View all</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
                {isLoading
                  ? Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="aspect-[3/4.2] bg-[#111520] rounded-2xl animate-pulse"></div>
                    ))
                  : seasonal.slice(0, 14).map((anime, idx) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        badge={idx < 2 ? "AIRING" : null}
                        onClick={setSelectedAnime}
                      />
                    ))}
              </div>
            </section>

            {/* ================= TOP RATED OF ALL TIME (HALL OF FAME) ================= */}
            <section id="top-rated" className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#ff5238] tracking-widest uppercase">
                    Hall of Fame
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                    Top Rated of All Time
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => switchCategory("Top Rated")}
                  className="text-xs font-semibold text-[#8c9ab8] hover:text-[#ff5238] transition-colors cursor-pointer group flex items-center gap-1"
                >
                  <span>View all</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
                {isLoading
                  ? Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="aspect-[3/4.2] bg-[#111520] rounded-2xl animate-pulse"></div>
                    ))
                  : topRated.slice(0, 14).map((anime, idx) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        rank={`#${idx + 1}`}
                        badge={idx === 0 ? "GOAT" : null}
                        onClick={setSelectedAnime}
                      />
                    ))}
              </div>
            </section>

            {/* ================= UPCOMING ANIME ================= */}
            <section id="upcoming" className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
                    Future Releases
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                    Most Anticipated Upcoming Anime
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => switchCategory("Upcoming")}
                  className="text-xs font-semibold text-[#8c9ab8] hover:text-[#ff5238] transition-colors cursor-pointer group flex items-center gap-1"
                >
                  <span>View all</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
                {isLoading
                  ? Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="aspect-[3/4.2] bg-[#111520] rounded-2xl animate-pulse"></div>
                    ))
                  : upcoming.slice(0, 14).map((anime) => (
                      <AnimeCard
                        key={anime.id}
                        anime={anime}
                        badge="SOON"
                        onClick={setSelectedAnime}
                      />
                    ))}
              </div>
            </section>
          </>
        )}

        {/* ================= BOTTOM ANNOUNCEMENT BANNER ================= */}
        <section className="relative rounded-2xl overflow-hidden border border-[#232c3f] bg-gradient-to-r from-[#101420] via-[#141928] to-[#121624] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Powered by AniList GraphQL Architecture
            </h3>
            <p className="text-xs text-[#8290ae] max-w-xl">
              Real-time synchronization for rankings, airing broadcasts, studio data, and community scores.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-white text-[#0a0d14] text-xs font-bold px-3 py-1.5 rounded-xl shadow-md">
              ANIME
            </span>
            <span className="bg-[#1a2030] text-[#7887a6] text-xs font-medium px-3 py-1.5 rounded-xl border border-[#2b354e]">
              GRAPHQL V2
            </span>
            <span className="bg-[#1a2030] text-[#7887a6] text-xs font-medium px-3 py-1.5 rounded-xl border border-[#2b354e]">
              REALTIME
            </span>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-[#161a26] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#62708d]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-wider">WATCHNEXT</span>
          <span>•</span>
          <span>Track, Discover, Watch together.</span>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/signin" className="hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="hover:text-white transition-colors">
            Sign Up
          </Link>
          <span className="hover:text-[#ff5238] transition-colors cursor-pointer">AniList Synced</span>
        </div>
      </footer>
    </div>
  );
}
