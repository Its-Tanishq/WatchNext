import { getAnimeById, getAnimeTitle } from "@/utils/anilist";
import AnimeDetailsView from "./AnimeDetailsView";
import Link from "next/link";

export const instant = false;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const anime = await getAnimeById(id);
  if (!anime) {
    return { title: "Anime Not Found | WatchNext" };
  }
  const title = getAnimeTitle(anime.title);
  return {
    title: `${title} | WatchNext`,
    description: anime.description
      ? anime.description.replace(/<[^>]*>?/gm, "").slice(0, 160)
      : "Discover full anime details, trailer, and official streaming links on WatchNext.",
  };
}

export default async function AnimePage({ params }) {
  const { id } = await params;
  const anime = await getAnimeById(id);

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#07090e] text-[#e8ebf2] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Anime Not Found</h1>
        <p className="text-xs text-[#7d8ca9]">The requested anime ID could not be loaded from AniList.</p>
        <Link
          href="/"
          className="bg-[#ff5238] hover:bg-[#ff6952] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          ← Return to Home
        </Link>
      </div>
    );
  }

  return <AnimeDetailsView anime={anime} />;
}
