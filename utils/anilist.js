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
