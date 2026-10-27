"use client";

import { getStreamingLinks } from "@/utils/streaming";
import { ExternalLink, Play } from "lucide-react";

export default function WatchOptions({ anime, compact = false }) {
  if (!anime) return null;

  const links = getStreamingLinks(anime);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <a
          href={links.crunchyroll.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Watch on Crunchyroll (Official)"
          className="px-2 py-1 bg-[#f47521]/15 hover:bg-[#f47521] border border-[#f47521]/40 text-[#f47521] hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
        >
          <span>CR</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <a
          href={links.hianime.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Watch on HiAnime (Free HD)"
          className="px-2 py-1 bg-[#5c67f5]/15 hover:bg-[#5c67f5] border border-[#5c67f5]/40 text-[#7a83ff] hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95"
        >
          <span>HiAnime</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#7988a8]">
        <span className="flex items-center gap-1.5">
          <Play className="w-3.5 h-3.5 text-[#ff5238] fill-[#ff5238]" />
          <span>Stream & Watch Now</span>
        </span>
        <span className="text-[10px] text-[#556482] font-medium lowercase">Official & Free</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Option 1: Crunchyroll (Official) */}
        <a
          href={links.crunchyroll.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#17141f] to-[#13111b] border border-[#f47521]/30 hover:border-[#f47521] hover:bg-[#1a1420] transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-[#f47521]/20 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#f47521] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-[#f47521]/30 group-hover:scale-105 transition-transform">
              CR
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white group-hover:text-[#f47521] transition-colors truncate">
                  Crunchyroll
                </span>
                <span className="text-[9px] font-extrabold uppercase bg-[#f47521]/20 text-[#f47521] border border-[#f47521]/30 px-1.5 py-0.2 rounded-full">
                  Official
                </span>
              </div>
              <p className="text-[10px] text-[#8694af] truncate">
                {links.crunchyroll.subtext}
              </p>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#f47521] shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </a>

        {/* Option 2: HiAnime (Free Stream) */}
        <a
          href={links.hianime.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#121422] to-[#10121d] border border-[#5c67f5]/30 hover:border-[#5c67f5] hover:bg-[#151829] transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-[#5c67f5]/20 cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#5c67f5] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-[#5c67f5]/30 group-hover:scale-105 transition-transform">
              HA
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white group-hover:text-[#7d86ff] transition-colors truncate">
                  HiAnime
                </span>
                <span className="text-[9px] font-extrabold uppercase bg-[#5c67f5]/20 text-[#7d86ff] border border-[#5c67f5]/30 px-1.5 py-0.2 rounded-full">
                  Free HD
                </span>
              </div>
              <p className="text-[10px] text-[#8694af] truncate">
                Free Streaming
              </p>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[#7d86ff] shrink-0 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </a>
      </div>
    </div>
  );
}
