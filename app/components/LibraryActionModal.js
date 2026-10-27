"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { LIBRARY_STATUSES, fetchSingleLibraryEntry, upsertAnimeToLibrary, deleteLibraryEntry } from "@/utils/library";
import { getAnimeTitle } from "@/utils/anilist";

export default function LibraryActionModal({ anime, isOpen, onClose, onEntryUpdated }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingEntry, setExistingEntry] = useState(null);

  // Form states
  const [status, setStatus] = useState("PLANNING");
  const [isFavourite, setIsFavourite] = useState(false);
  const [rewatchCounter, setRewatchCounter] = useState(0);
  const [userNotes, setUserNotes] = useState("");
  const [customLists, setCustomLists] = useState([]);
  const [newCustomListInput, setNewCustomListInput] = useState("");
  const [availableCustomLists, setAvailableCustomLists] = useState([
    "Masterpieces",
    "Comfort Anime",
    "Rewatch Later",
    "Must Watch with Friends",
  ]);
  const [showToast, setShowToast] = useState(null);

  const totalEpisodes = anime?.episodes || anime?.anime_total_episodes || null;
  const title = anime ? getAnimeTitle(anime.title || anime.anime_title) : "";
  const cover = anime?.coverImage?.extraLarge || anime?.coverImage?.large || anime?.anime_cover || "/images/hero-art.jpg";

  // Check auth and load existing entry
  useEffect(() => {
    if (!isOpen || !anime) return;
    const supabase = createClient();
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUser(user);

      if (user) {
        const { data: entry } = await fetchSingleLibraryEntry(supabase, anime.id || anime.anime_id);
        if (!isMounted) return;
        if (entry) {
          setExistingEntry(entry);
          setStatus(entry.status || "PLANNING");
          setIsFavourite(Boolean(entry.is_favourite));
          setRewatchCounter(entry.rewatch_counter || 0);
          setUserNotes(entry.user_notes || "");
          setCustomLists(entry.custom_lists || []);
        } else {
          // Defaults for new entry
          setExistingEntry(null);
          setStatus("PLANNING");
          setIsFavourite(false);
          setRewatchCounter(0);
          setUserNotes("");
          setCustomLists([]);
        }

        // Also fetch user custom lists from DB
        const { data: cLists } = await supabase.from("user_custom_lists").select("name").eq("user_id", user.id);
        if (cLists && cLists.length > 0) {
          const names = cLists.map((c) => c.name);
          setAvailableCustomLists((prev) => Array.from(new Set([...prev, ...names])));
        }
      }
      setLoading(false);
    }

    loadData();
    return () => { isMounted = false; };
  }, [isOpen, anime]);

  if (!isOpen || !anime) return null;

  const handleAddCustomList = (e) => {
    e?.preventDefault();
    const clean = newCustomListInput.trim();
    if (!clean) return;
    if (!customLists.includes(clean)) {
      setCustomLists([...customLists, clean]);
    }
    if (!availableCustomLists.includes(clean)) {
      setAvailableCustomLists([...availableCustomLists, clean]);
    }
    setNewCustomListInput("");
  };

  const handleToggleCustomList = (name) => {
    if (customLists.includes(name)) {
      setCustomLists(customLists.filter((l) => l !== name));
    } else {
      setCustomLists([...customLists, name]);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setShowToast({ type: "error", message: "Please sign in to save anime to your library!" });
      setTimeout(() => setShowToast(null), 3500);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const updates = {
      status,
      is_favourite: isFavourite,
      rewatch_counter: Number(rewatchCounter) || 0,
      user_notes: userNotes,
      custom_lists: customLists,
    };

    const { data, error } = await upsertAnimeToLibrary(supabase, anime, updates);

    if (error) {
      setShowToast({
        type: "error",
        message: error.message || "Failed to update library. Ensure database tables are created in Supabase.",
      });
      setTimeout(() => setShowToast(null), 4000);
    } else {
      setShowToast({ type: "success", message: `Updated "${title}" in library!` });
      if (onEntryUpdated) onEntryUpdated(data);
      setTimeout(() => {
        setShowToast(null);
        onClose();
      }, 800);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!existingEntry?.id) return;
    if (!confirm(`Remove "${title}" from your personal library?`)) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await deleteLibraryEntry(supabase, existingEntry.id);
    if (error) {
      setShowToast({ type: "error", message: "Failed to remove entry: " + error.message });
      setTimeout(() => setShowToast(null), 3000);
    } else {
      setShowToast({ type: "success", message: `Removed "${title}" from library.` });
      if (onEntryUpdated) onEntryUpdated({ id: existingEntry.id, deleted: true });
      setTimeout(() => {
        setShowToast(null);
        onClose();
      }, 700);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-[#0e121d] border border-[#232b3e] rounded-3xl shadow-2xl overflow-hidden text-[#e8ebf2] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Alert */}
        {showToast && (
          <div className={`absolute top-4 left-6 right-6 z-50 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border animate-fadeIn ${
            showToast.type === "error"
              ? "bg-rose-950/90 border-rose-500/50 text-rose-200"
              : "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
          }`}>
            <span>{showToast.type === "error" ? "⚠️" : "✓"}</span>
            <span className="flex-1">{showToast.message}</span>
          </div>
        )}

        {/* Modal Header with Anime Poster Banner */}
        <div className="p-5 border-b border-[#1b2234] bg-[#121624] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-[#1a2030]">
              <Image src={cover} alt={title} fill className="object-cover" sizes="48px" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff5238]">
                {existingEntry ? "Edit Library Entry" : "Add to Personal Library"}
              </span>
              <h3 className="text-sm font-bold text-white truncate">{title}</h3>
              <p className="text-[11px] text-[#7888a7]">
                {totalEpisodes ? `${totalEpisodes} Episodes` : "Episodes Unknown"} • {anime.format || "TV"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1b2131] hover:bg-[#252d43] text-[#8e9cb9] hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1 scrollbar-none">
          {!user && (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 text-amber-200 flex items-start gap-2.5">
              <span className="text-base">🔒</span>
              <p className="text-[11px] leading-relaxed">
                You are currently in guest mode. <a href="/signin" className="underline font-bold text-white hover:text-amber-300">Sign in</a> to permanently sync your anime library across all your devices in PostgreSQL.
              </p>
            </div>
          )}

          {/* 1. Status Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8292b2] flex items-center justify-between">
              <span>Watch Status</span>
              <span className="text-white font-normal text-[11px]">
                {LIBRARY_STATUSES.find((s) => s.id === status)?.label}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LIBRARY_STATUSES.filter((s) => s.id !== "ALL").map((s) => {
                const isSelected = status === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStatus(s.id);
                    }}
                    className={`px-3 py-2.5 rounded-xl border font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? "bg-[#ff5238] border-[#ff5238] text-white shadow-lg shadow-[#ff5238]/30 font-bold scale-[1.02]"
                        : "bg-[#141825] border-[#232b3e] text-[#8c9bb9] hover:text-white hover:bg-[#1b2234]"
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Favourite Toggle */}
          <div className="flex items-center justify-between bg-[#131724] border border-[#20283a] rounded-2xl p-3.5">
            <div className="flex items-center gap-2.5">
              <span className={`text-xl transition-transform ${isFavourite ? "scale-125" : "opacity-60"}`}>
                ⭐
              </span>
              <div>
                <p className="text-xs font-bold text-white">Add to Favourites</p>
                <p className="text-[11px] text-[#7786a4]">Pin this anime to your Hall of Fame showcase</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFavourite(!isFavourite)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isFavourite
                  ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                  : "bg-[#1b2131] text-[#8e9cb9] hover:text-white hover:bg-[#252d43]"
              }`}
            >
              {isFavourite ? "Favorited ★" : "Favorite"}
            </button>
          </div>

          {/* 3. Rewatch Counter */}
          <div className="flex items-center justify-between bg-[#131724] border border-[#20283a] rounded-2xl p-3.5">
            <div>
              <p className="text-xs font-bold text-white">Rewatch Counter</p>
              <p className="text-[11px] text-[#7786a4]">
                Rewatched {rewatchCounter} {rewatchCounter === 1 ? "time" : "times"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRewatchCounter(Math.max(0, rewatchCounter - 1))}
                className="w-8 h-8 rounded-lg bg-[#1c2334] hover:bg-[#273148] text-white font-bold flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                value={rewatchCounter}
                onChange={(e) => setRewatchCounter(Math.max(0, Number(e.target.value)))}
                className="w-12 bg-[#0a0d14] border border-[#242c40] rounded-lg py-1.5 px-1 text-center text-sm font-bold text-white outline-none focus:border-[#ff5238] shrink-0"
              />
              <button
                type="button"
                onClick={() => setRewatchCounter(rewatchCounter + 1)}
                className="w-8 h-8 rounded-lg bg-[#1c2334] hover:bg-[#273148] text-white font-bold flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                +
              </button>
            </div>
          </div>

          {/* 5. Custom Lists */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8292b2] block">
              Custom Lists
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableCustomLists.map((name) => {
                const isChecked = customLists.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleToggleCustomList(name)}
                    className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isChecked
                        ? "bg-purple-950/80 border-purple-500/50 text-purple-200 font-bold shadow-sm"
                        : "bg-[#141825] border-[#232b3e] text-[#8695b3] hover:text-white"
                    }`}
                  >
                    <span>{isChecked ? "✓" : "+"}</span>
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>

            {/* Input to create a new custom list tag */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="New custom list name (e.g. Cozy Vibes)..."
                value={newCustomListInput}
                onChange={(e) => setNewCustomListInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomList();
                  }
                }}
                className="flex-1 bg-[#0b0e16] border border-[#232c41] focus:border-purple-400 rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#525f7a] outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomList}
                className="bg-[#1b2234] hover:bg-[#263048] border border-[#2b364e] text-white px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Add List
              </button>
            </div>
          </div>

          {/* 6. Personal Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8292b2] block">
              Personal Notes & Thoughts (Private)
            </label>
            <textarea
              rows="2"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Your private notes, memorable quotes, favorite arc..."
              className="w-full bg-[#0b0e16] border border-[#232c41] focus:border-[#ff5238] rounded-xl p-3 text-xs text-white placeholder-[#525f7a] outline-none resize-none"
            />
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-[#1b2234] bg-[#0c101a] flex items-center justify-between gap-3">
          {existingEntry ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 rounded-xl transition-all cursor-pointer font-semibold"
            >
              Remove
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#7d8ca7] hover:text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-[#ff5238] to-[#ea3a22] hover:from-[#ff664e] hover:to-[#f24730] text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg shadow-[#ff5238]/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save to Library</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
