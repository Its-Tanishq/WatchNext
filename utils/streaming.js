import { getAnimeTitle } from "./anilist";

/**
 * Returns direct or search watch links for Crunchyroll and HiAnime
 * @param {Object} anime - Anime object from AniList or database
 */
export function getStreamingLinks(anime) {
  if (!anime) return { crunchyroll: null, hianime: null };

  const rawTitle = getAnimeTitle(anime.title || anime.anime_title || anime);
  // Clean up title (remove special bracket tags like [TV], (Dub), etc. for cleaner search)
  const cleanTitle = rawTitle.replace(/\s*\([^)]*\)|\s*\[[^\]]*\]/g, "").trim();

  // 1. Look for direct Crunchyroll link in externalLinks if available
  const externalLinks = anime.externalLinks || [];
  const directCrunchyroll = externalLinks.find(
    (l) => l.site?.toLowerCase() === "crunchyroll" && l.url
  );

  const directNetflix = externalLinks.find(
    (l) => l.site?.toLowerCase() === "netflix" && l.url
  );

  // Fallback search URLs
  const crunchyrollUrl = directCrunchyroll
    ? directCrunchyroll.url
    : `https://www.crunchyroll.com/search?q=${encodeURIComponent(cleanTitle)}`;

  const hianimeUrl = `https://hianime.to/search?keyword=${encodeURIComponent(cleanTitle)}`;

  return {
    title: cleanTitle,
    crunchyroll: {
      name: "Crunchyroll",
      label: "Watch on Crunchyroll",
      tag: "Official",
      subtext: directCrunchyroll ? "Direct Series Page" : "Official Stream",
      url: crunchyrollUrl,
      isDirect: Boolean(directCrunchyroll),
    },
    hianime: {
      name: "HiAnime",
      label: "Watch Free (HiAnime)",
      tag: "Free HD",
      subtext: "Free Streaming",
      url: hianimeUrl,
      isDirect: false,
    },
    netflix: directNetflix
      ? {
          name: "Netflix",
          label: "Watch on Netflix",
          tag: "Official",
          url: directNetflix.url,
          isDirect: true,
        }
      : null,
  };
}
