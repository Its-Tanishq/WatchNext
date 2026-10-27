/**
 * AniList GraphQL API Helper
 * Docs: https://anilist.gitbook.io/anilist-apiv2-docs/
 */

const ANILIST_API_URL = process.env.NEXT_PUBLIC_ANILIST_API_URL || "https://graphql.anilist.co";

/**
 * Generic GraphQL fetcher for AniList
 */
export async function fetchAniList(query, variables = {}, revalidate = 1800) {
  try {
    const res = await fetch(ANILIST_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate }, // Next.js ISR / cache for fast loads & low rate-limit usage
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`AniList API Error (${res.status}):`, errorText);
      return null;
    }

    const json = await res.json();
    if (json.errors) {
      console.error("AniList GraphQL Errors:", json.errors);
      return null;
    }

    return json.data;
  } catch (err) {
    console.error("Failed to fetch from AniList:", err);
    return null;
  }
}

/**
 * Helper to compute current anime season
 */
export function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth(); // 0 to 11
  const year = now.getFullYear();

  let season = "WINTER";
  if (month >= 0 && month <= 2) season = "WINTER";
  else if (month >= 3 && month <= 5) season = "SPRING";
  else if (month >= 6 && month <= 8) season = "SUMMER";
  else season = "FALL";

  return { season, year };
}

/**
 * Helper to get clean display title
 */
export function getAnimeTitle(titleObj) {
  if (!titleObj) return "Untitled";
  return titleObj.english || titleObj.romaji || titleObj.native || "Untitled";
}

/**
 * Helper to format score out of 10
 */
export function formatScore(score) {
  if (!score) return "N/A";
  return (score / 10).toFixed(1);
}

/**
 * 1. Trending Anime
 */
export async function getTrendingAnime(page = 1, perPage = 10) {
  const query = `
    query GetTrending($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], isAdult: false) {
          id
          title {
            english
            romaji
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          description(asHtml: false)
          averageScore
          popularity
          format
          status
          episodes
          duration
          genres
          season
          seasonYear
          nextAiringEpisode {
            airingAt
            episode
            timeUntilAiring
          }
          studios(isMain: true) {
            nodes {
              name
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query, { page, perPage }, 1800);
  return data?.Page?.media || [];
}

/**
 * 2. Seasonal Anime (e.g. Current Season)
 */
export async function getSeasonalAnime(season, seasonYear, page = 1, perPage = 10) {
  const current = getCurrentSeason();
  const s = season || current.season;
  const y = seasonYear || current.year;

  const query = `
    query GetSeasonal($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: [POPULARITY_DESC], isAdult: false) {
          id
          title {
            english
            romaji
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          averageScore
          format
          episodes
          status
          genres
          studios(isMain: true) {
            nodes {
              name
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query, { season: s, seasonYear: y, page, perPage }, 3600);
  return {
    season: s,
    seasonYear: y,
    list: data?.Page?.media || [],
  };
}

/**
 * 3. Top Rated Anime (All-Time)
 */
export async function getTopRatedAnime(page = 1, perPage = 10) {
  const query = `
    query GetTopRated($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: [SCORE_DESC], isAdult: false) {
          id
          title {
            english
            romaji
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          averageScore
          format
          episodes
          seasonYear
          genres
          studios(isMain: true) {
            nodes {
              name
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query, { page, perPage }, 7200);
  return data?.Page?.media || [];
}

/**
 * Helper to format confirmed release dates and countdowns
 */
export function formatReleaseDate(anime) {
  if (!anime) return { label: "TBA", isExact: false, countdown: null, type: "tba" };

  const { startDate, season, seasonYear, nextAiringEpisode } = anime;

  // Countdown if available
  let countdown = null;
  if (nextAiringEpisode?.timeUntilAiring) {
    const days = Math.ceil(nextAiringEpisode.timeUntilAiring / 86400);
    countdown = days > 0 ? `In ${days}d` : "Premiering";
  }

  // Exact Day + Month + Year
  if (startDate?.year && startDate?.month && startDate?.day) {
    const d = new Date(startDate.year, startDate.month - 1, startDate.day);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return { label, isExact: true, countdown, type: "exact" };
  }

  // Month + Year
  if (startDate?.year && startDate?.month) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const label = `${monthNames[startDate.month - 1]} ${startDate.year}`;
    return { label, isExact: false, countdown, type: "month" };
  }

  // Season + Year
  if (season && seasonYear) {
    const s = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
    return { label: `${s} ${seasonYear}`, isExact: false, countdown, type: "season" };
  }

  // Year only
  if (startDate?.year) {
    return { label: `${startDate.year}`, isExact: false, countdown, type: "year" };
  }

  return { label: "TBA", isExact: false, countdown: null, type: "tba" };
}

/**
 * 4. Upcoming Anime
 */
export async function getUpcomingAnime(page = 1, perPage = 10) {
  const query = `
    query GetUpcoming($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, status: NOT_YET_RELEASED, sort: [POPULARITY_DESC], isAdult: false) {
          id
          title {
            english
            romaji
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          description(asHtml: false)
          averageScore
          popularity
          startDate {
            year
            month
            day
          }
          nextAiringEpisode {
            episode
            airingAt
            timeUntilAiring
          }
          season
          seasonYear
          format
          status
          episodes
          genres
          studios(isMain: true) {
            nodes {
              name
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query, { page, perPage }, 7200);
  return data?.Page?.media || [];
}

/**
 * Helper to compute the 7 days of the current week (Monday to Sunday)
 */
export function getWeekDays() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  // Distance from Monday (1)
  const mondayDistance = currentDay === 0 ? -6 : 1 - currentDay;
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const fullDayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return dayNames.map((short, i) => {
    const offset = mondayDistance + i;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const isToday = offset === 0;
    return {
      label: fullDayNames[i],
      short,
      dateFormatted: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      offset,
      isToday,
    };
  });
}

/**
 * 5. Airing Schedule (Today / By Day offset: 0 for today, 1 for tomorrow, etc.)
 */
export async function getAiringSchedule(dayOffset = 0, perPage = 50) {
  const now = new Date();
  // Set day to target date 00:00:00 to 23:59:59
  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 0, 0, 0);
  const startSec = Math.floor(targetDate.getTime() / 1000);
  const endSec = startSec + 86400;

  const query = `
    query GetSchedule($start: Int, $end: Int, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id
          airingAt
          episode
          timeUntilAiring
          media {
            id
            title {
              english
              romaji
              native
            }
            coverImage {
              large
              medium
              extraLarge
              color
            }
            bannerImage
            description(asHtml: false)
            genres
            format
            averageScore
            popularity
            status
            episodes
            studios(isMain: true) {
              nodes {
                name
              }
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query, { start: startSec, end: endSec, perPage }, 300);
  return data?.Page?.airingSchedules || [];
}

/**
 * 6. Search Anime with Filters
 */
export async function searchAnime(searchTerm, page = 1, perPage = 6, genre = null) {
  if (!searchTerm && !genre) return [];

  const query = `
    query SearchAnime($search: String, $genre: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, search: $search, genre: $genre, sort: [SEARCH_MATCH, POPULARITY_DESC], isAdult: false) {
          id
          title {
            english
            romaji
          }
          coverImage {
            medium
            large
          }
          averageScore
          format
          status
          episodes
          seasonYear
        }
      }
    }
  `;

  const variables = { page, perPage };
  if (searchTerm) variables.search = searchTerm;
  if (genre) variables.genre = genre;

  const data = await fetchAniList(query, variables, 600);
  return data?.Page?.media || [];
}

/**
 * 7. Single Anime Details by ID
 */
export async function getAnimeById(id) {
  const query = `
    query GetAnimeById($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          english
          romaji
          native
        } 
        coverImage {
          extraLarge
          large
          medium
          color
        }
        bannerImage
        description(asHtml: false)
        averageScore
        meanScore
        popularity
        favourites
        format
        status
        episodes
        duration
        season
        seasonYear
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        genres
        tags {
          id
          name
          description
          rank
          isMediaSpoiler
        }
        studios {
          edges {
            isMain
            node {
              id
              name
            }
          }
        }
        rankings {
          id
          rank
          type
          allTime
          context
          year
          season
        }
        relations {
          edges {
            relationType
            node {
              id
              title {
                english
                romaji
              }
              coverImage {
                large
                medium
              }
              format
              type
              status
              averageScore
            }
          }
        }
        externalLinks {
          id
          site
          url
          icon
          color
          type
        }
        trailer {
          id
          site
          thumbnail
        }
        nextAiringEpisode {
          airingAt
          episode
          timeUntilAiring
        }
        recommendations(page: 1, perPage: 7, sort: [RATING_DESC]) {
          nodes {
            mediaRecommendation {
              id
              title {
                english
                romaji
              }
              coverImage {
                large
                medium
              }
              averageScore
              format
              episodes
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query, { id: Number(id) }, 1800);
  return data?.Media || null;
}

/**
 * 8. Flexible Category Fetcher with Pagination & Genre Filter
 */
export async function getCategoryAnime({
  category = "trending",
  page = 1,
  perPage = 21,
  genre = null,
  sort = null,
}) {
  const current = getCurrentSeason();

  let variables = {
    page,
    perPage,
  };

  if (genre && genre !== "All") {
    variables.genre = genre;
  }

  // Base query with pageInfo
  let query = `
    query GetCategoryMedia(
      $page: Int
      $perPage: Int
      $genre: String
      $sort: [MediaSort]
      $status: MediaStatus
      $season: MediaSeason
      $seasonYear: Int
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
        media(
          type: ANIME
          genre: $genre
          sort: $sort
          status: $status
          season: $season
          seasonYear: $seasonYear
          isAdult: false
        ) {
          id
          title {
            english
            romaji
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          description(asHtml: false)
          averageScore
          popularity
          format
          status
          episodes
          duration
          season
          seasonYear
          startDate {
            year
            month
            day
          }
          nextAiringEpisode {
            episode
            airingAt
            timeUntilAiring
          }
          genres
          studios(isMain: true) {
            nodes {
              name
            }
          }
        }
      }
    }
  `;

  if (category === "top-rated") {
    variables.sort = sort ? [sort] : ["SCORE_DESC"];
  } else if (category === "upcoming") {
    variables.status = "NOT_YET_RELEASED";
    variables.sort = sort ? [sort] : ["POPULARITY_DESC"];
  } else if (category === "seasonal") {
    variables.season = current.season;
    variables.seasonYear = current.year;
    variables.sort = sort ? [sort] : ["POPULARITY_DESC"];
  } else {
    // default trending
    variables.sort = sort ? [sort] : ["TRENDING_DESC", "POPULARITY_DESC"];
  }

  const data = await fetchAniList(query, variables, 600);
  return {
    pageInfo: data?.Page?.pageInfo || { hasNextPage: false, currentPage: page },
    media: data?.Page?.media || [],
    category,
    genre: genre || "All",
  };
}

/**
 * 11. Upcoming Sequels & Release Radar for user library anime
 * Queries relations of user's tracked anime to detect unreleased sequels, movies, and spin-offs.
 */
export async function getUpcomingRadarForAnimeList(animeIds = []) {
  if (!Array.isArray(animeIds) || animeIds.length === 0) return [];

  // Limit to first 40 unique IDs to prevent overly huge queries
  const cleanIds = Array.from(new Set(animeIds.map(Number).filter((n) => !isNaN(n) && n > 0))).slice(0, 40);
  if (cleanIds.length === 0) return [];

  const query = `
    query GetRadarRelations($ids: [Int]) {
      Page(page: 1, perPage: 50) {
        media(id_in: $ids, type: ANIME) {
          id
          type
          format
          status
          season
          seasonYear
          title {
            english
            romaji
            native
          }
          coverImage {
            extraLarge
            large
            medium
            color
          }
          bannerImage
          description(asHtml: false)
          episodes
          averageScore
          nextAiringEpisode {
            episode
            airingAt
            timeUntilAiring
          }
          startDate {
            year
            month
            day
          }
          studios(isMain: true) {
            nodes {
              name
            }
          }
          relations {
            edges {
              relationType
              node {
                id
                type
                format
                status
                season
                seasonYear
                title {
                  english
                  romaji
                  native
                }
                coverImage {
                  extraLarge
                  large
                  medium
                  color
                }
                bannerImage
                description(asHtml: false)
                episodes
                averageScore
                nextAiringEpisode {
                  episode
                  airingAt
                  timeUntilAiring
                }
                startDate {
                  year
                  month
                  day
                }
                studios(isMain: true) {
                  nodes {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniList(query, { ids: cleanIds }, 600);
  const mediaList = data?.Page?.media || [];

  const validRelationTypes = ["SEQUEL", "PREQUEL", "SIDE_STORY", "SPIN_OFF", "ALTERNATIVE"];
  const seenIds = new Set();
  const results = [];
  const nowMs = Date.now();

  function processNode(node, relationType, parentTitle) {
    if (!node || node.type !== "ANIME") return;
    const isUnreleased = node.status === "NOT_YET_RELEASED";
    const isReleasingWithNext = node.status === "RELEASING" && node.nextAiringEpisode;

    if (!isUnreleased && !isReleasingWithNext) return;
    if (seenIds.has(node.id)) return;
    seenIds.add(node.id);

    let targetTimestamp = null;
    let datePrecision = "tba";

    if (node.nextAiringEpisode?.airingAt) {
      targetTimestamp = node.nextAiringEpisode.airingAt * 1000;
      datePrecision = "exact";
    } else if (node.startDate?.year && node.startDate?.month) {
      const day = node.startDate.day || 1;
      targetTimestamp = new Date(node.startDate.year, node.startDate.month - 1, day).getTime();
      datePrecision = node.startDate.day ? "exact" : "month";
    } else if (node.season && node.seasonYear) {
      const seasonMonths = { WINTER: 0, SPRING: 3, SUMMER: 6, FALL: 9 };
      const month = seasonMonths[node.season] ?? 0;
      targetTimestamp = new Date(node.seasonYear, month, 1).getTime();
      datePrecision = "season";
    }

    let urgency = "ANNOUNCED_TBA";
    let urgencyLabel = "Announced / TBA";
    let urgencyColor = "#8e9cb8";

    if (targetTimestamp && targetTimestamp > nowMs) {
      const diffDays = Math.ceil((targetTimestamp - nowMs) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        urgency = "AIRING_WEEK";
        urgencyLabel = diffDays <= 1 ? "Airing Today / Tomorrow!" : `Airing in ${diffDays} Days`;
        urgencyColor = "#ef4444";
      } else if (diffDays <= 30) {
        urgency = "AIRING_MONTH";
        urgencyLabel = `Airing in ${diffDays} Days`;
        urgencyColor = "#f59e0b";
      } else {
        urgency = "UPCOMING_SEASON";
        urgencyLabel = node.season && node.seasonYear ? `${node.season} ${node.seasonYear}` : `Releasing in ${Math.round(diffDays / 30)} Months`;
        urgencyColor = "#3b82f6";
      }
    } else if (node.seasonYear) {
      urgency = "UPCOMING_SEASON";
      urgencyLabel = node.season ? `${node.season} ${node.seasonYear}` : `${node.seasonYear}`;
      urgencyColor = "#8b5cf6";
    }

    let relationBadge = "Upcoming Sequel";
    if (relationType === "SELF") relationBadge = "In Your Library";
    else if (relationType === "SEQUEL") relationBadge = "Sequel";
    else if (relationType === "SIDE_STORY") relationBadge = "Side Story";
    else if (relationType === "SPIN_OFF") relationBadge = "Spin-Off";
    else if (relationType === "ALTERNATIVE") relationBadge = "Alternative Version";
    else if (relationType === "PREQUEL") relationBadge = "Prequel";

    results.push({
      id: node.id,
      title: node.title,
      coverImage: node.coverImage,
      bannerImage: node.bannerImage,
      description: node.description,
      format: node.format,
      status: node.status,
      episodes: node.episodes,
      nextAiringEpisode: node.nextAiringEpisode,
      startDate: node.startDate,
      season: node.season,
      seasonYear: node.seasonYear,
      studios: node.studios?.nodes?.map((s) => s.name) || [],
      parentAnimeTitle: parentTitle || (node.title?.english || node.title?.romaji || "Anime"),
      relationType: relationType || "SELF",
      relationBadge,
      targetTimestamp,
      datePrecision,
      urgency,
      urgencyLabel,
      urgencyColor,
    });
  }

  for (const parent of mediaList) {
    const parentTitle = parent.title?.english || parent.title?.romaji || parent.title?.native || "Anime";

    // 1. If the parent anime itself in user's library is unreleased / upcoming, keep it in radar!
    processNode(parent, "SELF", parentTitle);

    // 2. Process all upcoming relations (sequels, movies, spin-offs)
    const edges = parent.relations?.edges || [];
    for (const edge of edges) {
      if (!validRelationTypes.includes(edge.relationType)) continue;
      processNode(edge.node, edge.relationType, parentTitle);
    }
  }

  results.sort((a, b) => {
    if (a.targetTimestamp && b.targetTimestamp) return a.targetTimestamp - b.targetTimestamp;
    if (a.targetTimestamp) return -1;
    if (b.targetTimestamp) return 1;
    if (a.seasonYear && b.seasonYear) return a.seasonYear - b.seasonYear;
    return 0;
  });

  return results;
}

/**
 * 12. Personalized Watchlist Recommendations
 * Fetches AniList community recommendations based on a user's seed anime.
 */
export async function getPersonalizedRecommendations(seedIds = [], excludeIds = []) {
  const DEFAULT_GATEWAY_SEEDS = [16498, 154587, 113415, 5114]; // Attack on Titan, Frieren, Jujutsu Kaisen, FMAB
  const isGuestMode = !seedIds || seedIds.length === 0;
  const activeSeedIds = (isGuestMode ? DEFAULT_GATEWAY_SEEDS : seedIds.slice(0, 5)).map(Number).filter(Boolean);

  if (activeSeedIds.length === 0) {
    return { isGuestMode: true, seeds: [], combined: [] };
  }

  // Construct dynamic aliased GraphQL query
  const queryFields = activeSeedIds.map((id, index) => `
    seed_${index}: Media(id: ${id}) {
      id
      title {
        english
        romaji
        native
      }
      coverImage {
        large
        medium
      }
      recommendations(page: 1, perPage: 12, sort: [RATING_DESC]) {
        nodes {
          rating
          userRating
          mediaRecommendation {
            id
            title {
              english
              romaji
              native
            }
            coverImage {
              extraLarge
              large
              medium
              color
            }
            bannerImage
            description(asHtml: false)
            averageScore
            popularity
            format
            status
            episodes
            season
            seasonYear
            genres
            studios(isMain: true) {
              nodes {
                name
              }
            }
            externalLinks {
              id
              site
              url
              icon
              color
              type
            }
          }
        }
      }
    }
  `).join("\n");

  const fullQuery = `query GetPersonalizedRecs {\n${queryFields}\n}`;

  const data = await fetchAniList(fullQuery, {}, 1800);
  if (!data) {
    return { isGuestMode, seeds: [], combined: [] };
  }

  const excludeSet = new Set([
    ...activeSeedIds,
    ...excludeIds.map(Number),
  ]);

  const seeds = [];
  const seenRecommendationIds = new Set();
  const allRecommendations = [];

  for (let i = 0; i < activeSeedIds.length; i++) {
    const rawSeed = data[`seed_${i}`];
    if (!rawSeed) continue;

    const seedRecs = [];
    const rawNodes = rawSeed.recommendations?.nodes || [];

    for (const node of rawNodes) {
      const rec = node.mediaRecommendation;
      if (!rec || !rec.id) continue;
      if (excludeSet.has(rec.id)) continue;

      seedRecs.push({
        ...rec,
        recRating: node.rating || 0,
      });

      if (!seenRecommendationIds.has(rec.id)) {
        seenRecommendationIds.add(rec.id);
        allRecommendations.push({
          ...rec,
          recRating: node.rating || 0,
          matchedSeedTitle: rawSeed.title?.english || rawSeed.title?.romaji || "Anime",
          matchedSeedId: rawSeed.id,
        });
      }
    }

    seeds.push({
      id: rawSeed.id,
      title: rawSeed.title,
      coverImage: rawSeed.coverImage,
      recommendations: seedRecs,
    });
  }

  allRecommendations.sort((a, b) => {
    const scoreA = a.averageScore || 0;
    const scoreB = b.averageScore || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (b.recRating || 0) - (a.recRating || 0);
  });

  return {
    isGuestMode,
    seeds,
    combined: allRecommendations,
  };
}


