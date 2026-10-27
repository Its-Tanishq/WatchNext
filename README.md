# 🎬 WatchNext

> **A modern, ultra-responsive Anime Discovery, Personal Watchlist & Release Radar platform.**  
> *Built with **Vibe Coding** ✨ — purely for fun, passion, and the love of anime.*

---

## 🌟 About The Project

**WatchNext** was created through **vibe coding** as an enjoyable, experimental, and fun project! The goal was to build a sleek, streaming-inspired (Crunchyroll / Netflix aesthetic) web app where anime fans can track their personal library, receive hyper-tailored recommendations based on what they've already watched, stay on top of upcoming sequels with an automated Release Radar, and jump straight into streaming with a single click.

Powered by the **AniList GraphQL API** and **Supabase SSR**, WatchNext delivers real-time anime data, zero-latency caching, and full database persistence with strict Row-Level Security.

---

## 🚀 Key Features

### 1. 🎯 Watchlist-Driven Smart Recommendations (Crunchyroll Style)
- **"Because you watched..."**: Analyzes your personal library (`Completed`, `Currently Watching`, and `Favourites`) and generates community-rated recommendations tailored to your taste.
- **Interactive Seed Switcher**: Easily switch between recommendations using dynamic pill buttons (e.g. *Because you liked: Solo Leveling*, *Because you liked: Attack on Titan*, or *All For You*).
- **Intelligent Duplicate Prevention**: Automatically excludes any anime you've already added to your library.
- **Shuffle & Refresh**: Pick random seeds from your library at any time to discover fresh titles.
- **Gateway Curations for Guests**: If you're new or haven't logged in yet, enjoy universal top-rated starter recommendations.

### 2. ⚡ Direct 1-Click Streaming (Dual Options)
- Direct streaming buttons integrated on every card hover, modal, and dedicated detail page:
  - **Crunchyroll (Official / Licensed)**: Direct streaming link extracted from AniList metadata, with fallback query search.
  - **HiAnime (Free HD Streaming)**: Direct fast search redirect for convenient viewing.
- Quick hover shortcuts `[ CR ↗ ]` and `[ HiAnime ↗ ]` on all anime cards across the site.

### 3. 📡 Automated Release Radar
- Never miss a new season, sequel, movie, or spin-off!
- Automatically queries relations across all anime in your library and detects:
  - Sequels, prequel announcements, upcoming movies, and OVAs.
- Real-time countdown badges (`Airing in 3d`, `Airing this week`, `Spring 2026`, etc.).
- Categorized filters: *Airing This Week*, *Airing This Month*, *Upcoming Season*, and *Announced / TBA*.

### 4. 📚 Comprehensive Personal Anime Library
- Track your watchlist across standard statuses:
  - **Currently Watching**
  - **Completed**
  - **Plan to Watch**
  - **On Hold**
  - **Dropped**
  - **Favourites**
- Detailed entry management:
  - Personal star rating (0–10)
  - Rewatch counter
  - Personal notes & custom list tagging
  - Started and completed dates
- **Dual View Modes**: Switch between Grid card view and Dense Table view with bulk actions.

### 5. 🗓️ Live Broadcast Schedule & Seasonal Explorer
- **Day-by-Day Broadcast Widget**: Check airing times for Monday through Sunday with live countdowns.
- **Seasonal Chart Explorer**: Explore seasonal lineups (Winter, Spring, Summer, Fall) with real-time genre filters.

### 6. 🔍 Instant 0ms Live Search
- Keystroke-level search with client-side memory caching and abort-controller request cancellation.
- Keyboard shortcut support (`⌘K` / `Ctrl+K`).

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI & Reactivity**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/) (100% clean vector icons, no raw emojis)
- **Database & Auth**: [Supabase](https://supabase.com/) (Postgres DB, Auth, SSR Cookies, Row Level Security)
- **Data Source**: [AniList GraphQL API v2](https://anilist.gitbook.io/anilist-apiv2-docs/)

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+ or 20+ installed
- A free [Supabase](https://supabase.com/) project (for user auth & library storage)

### 1. Clone the repository
```bash
git clone https://github.com/YourUsername/WatchNext.git
cd WatchNext
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ANILIST_API_URL=https://graphql.anilist.co
```

### 4. Setup Database Schema
Execute the SQL migration located in `supabase/migrations/20261027000000_personal_anime_library.sql` in your Supabase SQL Editor. This sets up:
- `user_anime_library` table with unique constraints per user & anime.
- `user_custom_lists` table.
- Row-Level Security (RLS) policies ensuring users only read and mutate their own library entries.

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```text
WatchNext/
├── app/
│   ├── anime/[id]/                # Dedicated anime detail view
│   ├── api/anime/
│   │   ├── category/              # Paginated category anime fetcher
│   │   ├── home/                  # Curated homepage dataset
│   │   ├── radar/                 # Automated upcoming release tracker
│   │   ├── recommendations/       # Personalized watchlist recommendations
│   │   ├── schedule/              # Weekly airing schedule
│   │   └── search/                # AniList instant live search
│   ├── components/
│   │   ├── AnimeCard.js           # Poster card with streaming hover actions
│   │   ├── AnimeDetailModal.js    # Interactive anime modal view
│   │   ├── CategoryExplorer.js    # Dedicated category browser
│   │   ├── ScheduleExplorer.js    # Weekly schedule viewer
│   │   ├── WatchlistRecommendations.js # Crunchyroll-style recommendation section
│   │   └── WatchOptions.js        # Crunchyroll & HiAnime stream launcher
│   ├── library/                   # Personal anime library & radar page
│   ├── layout.js                  # App root layout with font and metadata
│   └── page.js                    # Main homepage
├── supabase/
│   └── migrations/                # Database migrations & RLS SQL
├── utils/
│   ├── anilist.js                 # GraphQL queries & helpers
│   ├── library.js                 # Supabase library CRUD queries
│   ├── streaming.js               # Clean streaming link builders
│   └── supabase/                  # Supabase browser & server clients
├── package.json
└── README.md
```

---

## 💖 Vibe Coded With Passion

This application is a **fun, vibe-coded passion project** created to provide a fast, gorgeous, and ad-free experience for anime enthusiasts.

*Disclaimer: WatchNext does not host any video files or media streams. All anime data is provided by the public AniList API, and streaming links direct to official and third-party platforms.*
