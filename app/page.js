"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("Home");
  const [activeFilter, setActiveFilter] = useState("For You");
  const [activeScheduleDay, setActiveScheduleDay] = useState("T");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const filterTabs = [
    "For You",
    "Trending",
    "Top Rated",
    "Airing Now",
    "Fall 2026",
    "Movies & Specials",
  ];

  // Continue Watching List
  const continueWatching = [
    {
      id: "hollow-circuit",
      title: "Hollow Circuit",
      progress: "EP 4 / 12 • 18m left",
      percent: 65,
      image: "/images/hollow-circuit.jpg",
    },
    {
      id: "iron-blossom",
      title: "Iron Blossom",
      progress: "EP 7 / 24 • 12m left",
      percent: 32,
      image: "/images/iron-blossom.jpg",
    },
    {
      id: "deep-current",
      title: "Deep Current",
      progress: "EP 1 / 12 • Just started",
      percent: 10,
      image: "/images/deep-current.jpg",
    },
  ];

  // Trending Now List
  const trendingList = [
    {
      rank: "#1",
      badge: "HOT",
      rating: "9.41",
      title: "Neon Requiem",
      type: "Fall 2026 • TV",
      episodes: "24 eps • Mappa",
      image: "/images/neon-requiem.jpg",
    },
    {
      rank: "#2",
      badge: "TOP",
      rating: "9.28",
      title: "Starfall Bakery",
      type: "Fall 2026 • TV",
      episodes: "12 eps • CloverWorks",
      image: "/images/starfall-bakery.jpg",
    },
    {
      rank: "#3",
      badge: "NEW",
      rating: "9.22",
      title: "Iron Blossom",
      type: "Fall 2026 • TV",
      episodes: "24 eps • Ufotable",
      image: "/images/iron-blossom.jpg",
    },
    {
      rank: "#4",
      rating: "9.17",
      title: "Deep Current",
      type: "Fall 2026 • TV",
      episodes: "12 eps • Wit Studio",
      image: "/images/deep-current.jpg",
    },
    {
      rank: "#5",
      rating: "9.10",
      title: "Paper Moons",
      type: "Fall 2026 • TV",
      episodes: "13 eps • CoMix Wave",
      image: "/images/paper-moons.jpg",
    },
    {
      rank: "#6",
      rating: "9.04",
      title: "Hollow Circuit",
      type: "Fall 2026 • TV",
      episodes: "12 eps • Production I.G",
      image: "/images/hollow-circuit.jpg",
    },
    {
      rank: "#7",
      rating: "8.92",
      title: "Moon & Ember",
      type: "Fall 2026 • Movie",
      episodes: "Film • Ghibli",
      image: "/images/moon-ember.jpg",
    },
  ];

  // Fall 2026 Seasonal List
  const seasonalList = [
    {
      rank: "#1",
      rating: "9.12",
      badge: "HOT",
      title: "Skywhale Chronicle",
      type: "Fall 2026 • TV",
      episodes: "24 eps • Trigger",
      image: "/images/skywhale.jpg",
    },
    {
      rank: "RANK 01",
      rating: "9.02",
      badge: "NEW",
      title: "Iron Blossom",
      type: "Fall 2026 • TV",
      episodes: "24 eps • Ufotable",
      image: "/images/iron-blossom.jpg",
    },
    {
      rank: "#3",
      rating: "8.98",
      title: "Hollow Circuit",
      type: "Fall 2026 • TV",
      episodes: "12 eps • Production I.G",
      image: "/images/hollow-circuit.jpg",
    },
    {
      rank: "#4",
      rating: "8.91",
      title: "Neon Requiem",
      type: "Fall 2026 • TV",
      episodes: "24 eps • Mappa",
      image: "/images/neon-requiem.jpg",
    },
    {
      rank: "#5",
      rating: "8.77",
      title: "Deep Current",
      type: "Fall 2026 • TV",
      episodes: "12 eps • Wit Studio",
      image: "/images/deep-current.jpg",
    },
    {
      rank: "#6",
      rating: "8.65",
      title: "Paper Moons",
      type: "Fall 2026 • TV",
      episodes: "13 eps • CoMix Wave",
      image: "/images/paper-moons.jpg",
    },
    {
      rank: "#7",
      rating: "8.42",
      title: "Starfall Bakery",
      type: "Fall 2026 • TV",
      episodes: "12 eps • CloverWorks",
      image: "/images/starfall-bakery.jpg",
    },
  ];

  // All Time Hall of Fame
  const hallOfFame = [
    {
      rank: "#1",
      rating: "9.50",
      badge: "#1",
      title: "Moon & Ember",
      type: "2024 • Film",
      episodes: "Studio Ghibli",
      image: "/images/moon-ember.jpg",
    },
    {
      rank: "#2",
      rating: "9.34",
      title: "Voyager Reactor",
      type: "2023 • TV",
      episodes: "26 eps • Sunrise",
      image: "/images/hollow-circuit.jpg",
    },
    {
      rank: "#3",
      rating: "9.25",
      title: "Demon Blade",
      type: "2022 • TV",
      episodes: "26 eps • Ufotable",
      image: "/images/iron-blossom.jpg",
    },
    {
      rank: "#4",
      rating: "9.18",
      title: "Umami Wars",
      type: "2021 • TV",
      episodes: "12 eps • J.C. Staff",
      image: "/images/starfall-bakery.jpg",
    },
    {
      rank: "#5",
      rating: "9.14",
      title: "Silent Orbit",
      type: "2025 • TV",
      episodes: "12 eps • Bones",
      image: "/images/hero-art.jpg",
    },
    {
      rank: "#6",
      rating: "9.11",
      title: "Ronin's Alley",
      type: "2023 • TV",
      episodes: "24 eps • Mappa",
      image: "/images/neon-requiem.jpg",
    },
    {
      rank: "#7",
      rating: "8.99",
      title: "Glass River",
      type: "2022 • Film",
      episodes: "Kyoto Animation",
      image: "/images/deep-current.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-[#e8ebf2] font-sans selection:bg-[#ff5238] selection:text-white pb-16">
      {/* ================= STICKY TOP NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-[#07090e]/90 backdrop-blur-md border-b border-[#181d2a]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff5b42] to-[#f03b24] flex items-center justify-center shadow-lg shadow-[#ff5238]/25 group-hover:scale-105 transition-transform">
                <span className="font-extrabold text-white text-base tracking-wider">W</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold tracking-widest text-base text-white">WATCHNEXT</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff5238] ml-1 mt-0.5 inline-block"></span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              {["Home", "Discover", "Seasonal", "Schedule", "Library", "Community"].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? "text-white bg-[#141824] font-semibold"
                        : "text-[#8592ad] hover:text-white hover:bg-[#10141f]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Search, Notification & Auth / Profile */}
          <div className="flex items-center gap-3">
            {/* Search Input Bar */}
            <div className="relative hidden sm:block w-64 lg:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anime, movies, studios..."
                className="w-full bg-[#11141e] border border-[#212738] focus:border-[#ff5238] focus:ring-1 focus:ring-[#ff5238] rounded-xl pl-9 pr-12 py-1.5 text-xs text-white placeholder-[#505c77] outline-none transition-all"
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
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#1a1f2e] border border-[#273047] text-[#6d7b9c] px-1.5 py-0.5 rounded font-mono">
                ⌘K
              </span>
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
                /* Authenticated User Pill with dropdown */
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

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#10141f] border border-[#242b3e] rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn">
                      <div className="px-3.5 py-2 border-b border-[#1b2233]">
                        <p className="text-[11px] text-[#7886a3]">Signed in as</p>
                        <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                      </div>
                      <Link
                        href="#library"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs text-[#a0acc7] hover:text-white hover:bg-[#181f30] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        <span>My Watchlist</span>
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
                /* Unauthenticated Guest View */
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
        {/* ================= SUB-NAVIGATION FILTER CHIPS ================= */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {filterTabs.map((chip) => {
              const isSelected = activeFilter === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setActiveFilter(chip)}
                  className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white text-[#0a0d14] font-semibold shadow-sm"
                      : "bg-[#11141e] border border-[#202636] text-[#8e9cb9] hover:text-white hover:border-[#2f384e]"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[#7e8ba8] shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-medium">Airing schedule synced • JST 21:00</span>
          </div>
        </section>

        {/* ================= MASSIVE HERO FEATURED SHOWCASE ================= */}
        <section className="relative rounded-3xl overflow-hidden border border-[#202738] bg-[#0c0f17] shadow-2xl">
          {/* Panoramic Background Art with Vignettes */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/skywhale.jpg"
              alt="Skywhale Chronicle Key Visual"
              fill
              priority
              className="object-cover object-center brightness-60 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/70 to-[#0a0d14]/40"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14] via-[#0a0d14]/85 to-transparent"></div>
          </div>

          {/* Hero Content Grid */}
          <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-center gap-8">
            {/* Left Poster Thumbnail Card */}
            <div className="relative w-44 sm:w-52 aspect-[3/4] rounded-2xl overflow-hidden border border-white/15 shadow-2xl shrink-0 group">
              <Image
                src="/images/hero-art.jpg"
                alt="Skywhale Chronicle Titan Poster"
                fill
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3 text-center">
                <span className="text-[11px] font-bold text-white tracking-widest uppercase bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                  Episode 9 Live
                </span>
              </div>
            </div>

            {/* Right Hero Details */}
            <div className="flex-1 space-y-4 text-left">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="bg-[#ff5238] text-white px-3 py-1 rounded-full shadow-lg shadow-[#ff5238]/30 flex items-center gap-1.5">
                  <span>🔥</span> #1 Trending Now
                </span>
                <span className="bg-[#141824]/80 backdrop-blur-md border border-[#2b3348] text-white/90 px-3 py-1 rounded-full">
                  Fall 2026 • TV (24 eps)
                </span>
                <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Airing
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-none drop-shadow-md">
                Skywhale Chronicle
              </h1>

              {/* Description */}
              <p className="max-w-2xl text-xs sm:text-sm text-[#aab6d1] leading-relaxed line-clamp-3">
                In a world of shattered floating skies, sky-whale leviathans navigate the ethereal tempest... Join the wanderer Ren on a voyage through forbidden heavens to uncover an ancient celestial mystery that could restore the falling realms.
              </p>

              {/* Metadata & Genres */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#95a3c2] pt-1">
                <div className="flex items-center gap-1 text-[#ffb703] font-bold bg-[#151926] px-2.5 py-1 rounded-lg border border-[#252d42]">
                  <span>★</span>
                  <span className="text-white">9.12</span>
                  <span className="text-[#6d7994] font-normal">(128k reviews)</span>
                </div>
                <span className="bg-[#151926] px-2.5 py-1 rounded-lg border border-[#252d42]">Adventure</span>
                <span className="bg-[#151926] px-2.5 py-1 rounded-lg border border-[#252d42]">Fantasy</span>
                <span className="bg-[#151926] px-2.5 py-1 rounded-lg border border-[#252d42]">Drama</span>
                <span className="bg-[#151926] px-2.5 py-1 rounded-lg border border-[#252d42]">Sci-Fi • 24 min/ep</span>
              </div>

              {/* Actions & Pagination */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="bg-gradient-to-r from-[#ff5238] to-[#ea3a22] hover:from-[#ff674f] hover:to-[#f24730] text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-[#ff5238]/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Watch Now</span>
                  </button>

                  <button
                    type="button"
                    className="bg-[#171b29]/80 hover:bg-[#202638] text-white font-medium text-sm px-4 py-2.5 rounded-xl border border-[#28324a] flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>+</span>
                    <span>Add to List</span>
                  </button>

                  <button
                    type="button"
                    className="text-xs text-[#8c9ab8] hover:text-white px-3 py-2 transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>

                {/* Pagination Pill Indicators */}
                <div className="flex items-center gap-2 text-right">
                  <span className="text-[10px] text-[#707e9e] font-semibold tracking-wider uppercase hidden sm:inline">
                    EPISODE 9 PREMIERES TODAY
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-1.5 rounded-full bg-[#ff5238]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CONTINUE WATCHING ================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Continue Watching</h2>
            <Link href="/library" className="text-xs font-semibold text-[#8c9ab8] hover:text-[#ff5238] transition-colors">
              My Library →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {continueWatching.map((item) => (
              <div
                key={item.id}
                className="bg-[#0f121b] border border-[#1f2536] hover:border-[#313b52] rounded-2xl p-3 flex items-center gap-4 transition-all duration-300 group"
              >
                <div className="relative w-28 sm:w-32 aspect-[16/10] rounded-xl overflow-hidden shrink-0 bg-[#161a26]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/30"></div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h3 className="text-sm font-bold text-white truncate leading-tight group-hover:text-[#ff5238] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#7b89a6] mt-0.5 truncate">{item.progress}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#1b202e] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#ff5238] h-full rounded-full transition-all"
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>

                  {/* Resume Action */}
                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 bg-[#171c29] hover:bg-[#ff5238] hover:text-white border border-[#263045] hover:border-[#ff5238] text-[11px] text-white/90 font-medium px-3 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      <span>▶</span>
                      <span>Resume</span>
                    </button>
                    <button type="button" aria-label="Menu" className="text-[#64718e] hover:text-white p-1 text-xs">
                      •••
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= TRENDING NOW ================= */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#ff5238] tracking-widest uppercase">
                Weekly Audience Choice Ranking
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">Trending Now</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/trending" className="text-xs font-semibold text-[#8c9ab8] hover:text-[#ff5238] transition-colors mr-2">
                View all →
              </Link>
              <button aria-label="Previous" className="w-7 h-7 rounded-lg bg-[#11141e] border border-[#212738] hover:border-[#353f57] text-[#8e9cb9] hover:text-white flex items-center justify-center text-xs cursor-pointer">
                ‹
              </button>
              <button aria-label="Next" className="w-7 h-7 rounded-lg bg-[#11141e] border border-[#212738] hover:border-[#353f57] text-[#8e9cb9] hover:text-white flex items-center justify-center text-xs cursor-pointer">
                ›
              </button>
            </div>
          </div>

          {/* 7 Vertical Poster Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
            {trendingList.map((anime) => (
              <div
                key={anime.title}
                className="group relative rounded-2xl overflow-hidden bg-[#0e111a] border border-[#1e2434] hover:border-[#ff5238]/60 hover:shadow-xl hover:shadow-[#ff5238]/10 transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Poster Image */}
                <div className="relative aspect-[3/4.2] w-full overflow-hidden bg-[#161a26]">
                  <Image
                    src={anime.image}
                    alt={anime.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e111a] via-black/20 to-transparent"></div>

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className="bg-[#0b0e16]/85 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      {anime.rating}
                    </span>
                    {anime.badge && (
                      <span className="bg-[#ff5238] text-white text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                        {anime.badge}
                      </span>
                    )}
                  </div>

                  {/* Bottom Rank */}
                  <span className="absolute bottom-2 left-2 text-2xl font-black text-white/90 drop-shadow-md">
                    {anime.rank}
                  </span>
                </div>

                {/* Details */}
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-white truncate leading-tight group-hover:text-[#ff5238] transition-colors">
                    {anime.title}
                  </h3>
                  <div className="mt-1 text-[10px] text-[#717f9e]">
                    <p className="truncate">{anime.type}</p>
                    <p className="truncate text-[#596683]">{anime.episodes}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= AIRING SCHEDULE WIDGET ================= */}
        <section className="bg-[#0c0f17] border border-[#1e2434] rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            {/* Left Control Card */}
            <div className="lg:w-60 shrink-0 space-y-3">
              <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                Today&apos;s Lineup
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">Airing Schedule</h2>

              {/* Day Selector Pills */}
              <div className="flex items-center gap-1 pt-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
                  const isActive = idx === 3 && activeScheduleDay === "T";
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveScheduleDay(day)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#ff5238] text-white shadow-md shadow-[#ff5238]/30"
                          : "bg-[#141824] border border-[#232b3d] text-[#7c8aa6] hover:text-white"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <Link
                href="/schedule"
                className="inline-flex items-center gap-1.5 text-xs text-[#a2b0ce] hover:text-white font-medium pt-2"
              >
                <span>📅 Full Schedule</span>
                <span>→</span>
              </Link>
            </div>

            {/* Right Schedule Items List */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  time: "18:30",
                  status: "LIVE",
                  statusColor: "bg-red-500",
                  title: "Skywhale Chronicle EP 9",
                  category: "Action • Sci-Fi",
                },
                {
                  time: "20:00",
                  status: "In 1h 20m",
                  statusColor: "bg-emerald-400",
                  title: "Neon Requiem EP 10",
                  category: "Fantasy • Mystery",
                },
                {
                  time: "21:15",
                  status: "Tomorrow",
                  statusColor: "bg-cyan-400",
                  title: "Paper Moons EP 6",
                  category: "Romance • Drama",
                },
                {
                  time: "23:00",
                  status: "Fri",
                  statusColor: "bg-purple-400",
                  title: "Hollow Circuit EP 8",
                  category: "Mecha • Cyberpunk",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#11141f] border border-[#212739] hover:border-[#323d57] rounded-xl p-3.5 space-y-2 flex flex-col justify-between transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-white font-bold">{item.time}</span>
                    <span className="text-[10px] font-semibold text-white/90 bg-[#191f2f] px-2 py-0.5 rounded-md border border-white/5 flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.statusColor}`}></span>
                      {item.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white truncate">{item.title}</h3>
                    <p className="text-[10px] text-[#717f9e] mt-0.5">{item.category}</p>
                  </div>
                  <button
                    type="button"
                    className="w-full text-center text-[10px] font-semibold text-[#8f9ebf] hover:text-white bg-[#171c2b] hover:bg-[#20273a] py-1.5 rounded-lg border border-[#252e44] transition-colors cursor-pointer"
                  >
                    🔔 Remind me
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= FALL 2026 SEASONAL ================= */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#ff5238] tracking-widest uppercase">
                Seasonal Chart
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                Fall 2026 Seasonal
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/seasonal" className="text-xs font-semibold text-[#8c9ab8] hover:text-[#ff5238] transition-colors mr-2">
                View all →
              </Link>
              <button aria-label="Previous" className="w-7 h-7 rounded-lg bg-[#11141e] border border-[#212738] hover:border-[#353f57] text-[#8e9cb9] hover:text-white flex items-center justify-center text-xs cursor-pointer">
                ‹
              </button>
              <button aria-label="Next" className="w-7 h-7 rounded-lg bg-[#11141e] border border-[#212738] hover:border-[#353f57] text-[#8e9cb9] hover:text-white flex items-center justify-center text-xs cursor-pointer">
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
            {seasonalList.map((anime) => (
              <div
                key={anime.title}
                className="group relative rounded-2xl overflow-hidden bg-[#0e111a] border border-[#1e2434] hover:border-[#ff5238]/60 hover:shadow-xl hover:shadow-[#ff5238]/10 transition-all duration-300 flex flex-col cursor-pointer"
              >
                <div className="relative aspect-[3/4.2] w-full overflow-hidden bg-[#161a26]">
                  <Image
                    src={anime.image}
                    alt={anime.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e111a] via-black/20 to-transparent"></div>

                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className="bg-[#0b0e16]/85 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      {anime.rating}
                    </span>
                    {anime.badge && (
                      <span className="bg-[#ff5238] text-white text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                        {anime.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-white truncate leading-tight group-hover:text-[#ff5238] transition-colors">
                    {anime.title}
                  </h3>
                  <div className="mt-1 text-[10px] text-[#717f9e]">
                    <p className="truncate">{anime.type}</p>
                    <p className="truncate text-[#596683]">{anime.episodes}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= 2-COLUMN ROW: RECOMMENDED FOR YOU & STATS ================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Recommended For You */}
          <div className="lg:col-span-2 bg-[#0c0f17] border border-[#1e2434] rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Recommended For You</h2>
                <p className="text-[11px] text-[#7583a1]">Based on your affinity for Cyberpunk + Fantasy</p>
              </div>
              <span className="text-[10px] bg-[#161a26] text-[#7e8ca8] px-2.5 py-1 rounded-full border border-[#252c3f]">
                Curated by AI Taste Engine
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  title: "Starfall Bakery",
                  match: "Because you liked slice-of-life",
                  image: "/images/starfall-bakery.jpg",
                  rating: "9.28",
                },
                {
                  title: "Ronin's Alley",
                  match: "Similar to Iron Blossom",
                  image: "/images/neon-requiem.jpg",
                  rating: "9.11",
                },
                {
                  title: "Hollow Circuit",
                  match: "Sci-Fi • 98% Match",
                  image: "/images/hollow-circuit.jpg",
                  rating: "8.98",
                },
              ].map((rec, i) => (
                <div
                  key={i}
                  className="bg-[#10141f] border border-[#202638] hover:border-[#323d57] rounded-xl overflow-hidden group cursor-pointer transition-colors"
                >
                  <div className="relative aspect-[16/10] w-full bg-[#181d2a]">
                    <Image
                      src={rec.image}
                      alt={rec.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-bold text-[#ffb703]">
                      ★ {rec.rating}
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-[10px] text-cyan-400 font-medium truncate">{rec.match}</p>
                    <h3 className="text-xs font-bold text-white truncate">{rec.title}</h3>
                    <button
                      type="button"
                      className="mt-2 w-full text-center text-[10px] bg-[#181d2a] hover:bg-[#ff5238] hover:text-white text-[#8e9cb8] py-1 rounded-lg border border-[#273045] transition-colors cursor-pointer"
                    >
                      + Add to Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Col: My Stats Snapshot */}
          <div className="bg-[#0c0f17] border border-[#1e2434] rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">My Stats Snapshot</h2>

              {/* Number Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#11141f] border border-[#212739] rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-white">342</div>
                  <div className="text-[10px] text-[#6e7c99] uppercase tracking-wider font-semibold">Episodes Watched</div>
                </div>
                <div className="bg-[#11141f] border border-[#212739] rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-white">61d</div>
                  <div className="text-[10px] text-[#6e7c99] uppercase tracking-wider font-semibold">Total Watch Time</div>
                </div>
              </div>

              {/* Genre Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-[#818fae]">
                  <span>Genre Breakdown</span>
                  <span className="text-white font-medium">Top: Action</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#161a26]">
                  <div className="bg-[#ff5238] h-full" style={{ width: "45%" }} title="Action 45%"></div>
                  <div className="bg-cyan-400 h-full" style={{ width: "28%" }} title="Sci-Fi 28%"></div>
                  <div className="bg-amber-400 h-full" style={{ width: "15%" }} title="Drama 15%"></div>
                  <div className="bg-indigo-500 h-full" style={{ width: "12%" }} title="Others 12%"></div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#717e9c] pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#ff5238]"></span> Action 45%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Sci-Fi 28%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> Drama 15%
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full bg-[#161b28] hover:bg-[#20273a] text-white text-xs font-semibold py-2.5 rounded-xl border border-[#293247] transition-colors cursor-pointer"
            >
              Open Full Statistics →
            </button>
          </div>
        </section>

        {/* ================= TOP RATED OF ALL TIME (HALL OF FAME) ================= */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#ff5238] tracking-widest uppercase">
                Hall of Fame
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                Top Rated of All Time
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/top-rated" className="text-xs font-semibold text-[#8c9ab8] hover:text-[#ff5238] transition-colors mr-2">
                View all →
              </Link>
              <button aria-label="Previous" className="w-7 h-7 rounded-lg bg-[#11141e] border border-[#212738] hover:border-[#353f57] text-[#8e9cb9] hover:text-white flex items-center justify-center text-xs cursor-pointer">
                ‹
              </button>
              <button aria-label="Next" className="w-7 h-7 rounded-lg bg-[#11141e] border border-[#212738] hover:border-[#353f57] text-[#8e9cb9] hover:text-white flex items-center justify-center text-xs cursor-pointer">
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
            {hallOfFame.map((anime) => (
              <div
                key={anime.title}
                className="group relative rounded-2xl overflow-hidden bg-[#0e111a] border border-[#1e2434] hover:border-[#ff5238]/60 hover:shadow-xl hover:shadow-[#ff5238]/10 transition-all duration-300 flex flex-col cursor-pointer"
              >
                <div className="relative aspect-[3/4.2] w-full overflow-hidden bg-[#161a26]">
                  <Image
                    src={anime.image}
                    alt={anime.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e111a] via-black/20 to-transparent"></div>

                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span className="bg-[#0b0e16]/85 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      {anime.rating}
                    </span>
                    {anime.badge && (
                      <span className="bg-[#ff5238] text-white text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded shadow-sm">
                        {anime.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <h3 className="text-xs font-bold text-white truncate leading-tight group-hover:text-[#ff5238] transition-colors">
                    {anime.title}
                  </h3>
                  <div className="mt-1 text-[10px] text-[#717f9e]">
                    <p className="truncate">{anime.type}</p>
                    <p className="truncate text-[#596683]">{anime.episodes}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= BOTTOM ANNOUNCEMENT BANNER ================= */}
        <section className="relative rounded-2xl overflow-hidden border border-[#232c3f] bg-gradient-to-r from-[#101420] via-[#141928] to-[#121624] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Movies & TV are coming to WatchNext.
            </h3>
            <p className="text-xs text-[#8290ae] max-w-xl">
              Expanding beyond anime: enjoy theatrical blockbusters, international cinema, and streaming series in high definition.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-white text-[#0a0d14] text-xs font-bold px-3 py-1.5 rounded-xl shadow-md">
              ANIME
            </span>
            <span className="bg-[#1a2030] text-[#7887a6] text-xs font-medium px-3 py-1.5 rounded-xl border border-[#2b354e]">
              MOVIES - 2026
            </span>
            <span className="bg-[#1a2030] text-[#7887a6] text-xs font-medium px-3 py-1.5 rounded-xl border border-[#2b354e]">
              TV - 2026
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
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
          <Link href="/api" className="hover:text-white transition-colors">
            API
          </Link>
          <Link href="/status" className="hover:text-white transition-colors">
            Status
          </Link>
          <span className="hover:text-[#ff5238] transition-colors cursor-pointer">Discord</span>
        </div>
      </footer>
    </div>
  );
}
