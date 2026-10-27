"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, Radio, Bell } from "lucide-react";

export default function RadarCountdown({ targetTimestamp, datePrecision, urgency }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetTimestamp || datePrecision !== "exact") return;

    function calculate() {
      const now = Date.now();
      const diff = targetTimestamp - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPassed: false });
    }

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetTimestamp, datePrecision]);

  if (datePrecision === "exact" && timeLeft) {
    if (timeLeft.isPassed) {
      return (
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-xl">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Airing Now / Premiered!</span>
        </div>
      );
    }

    const isUrgent = urgency === "AIRING_WEEK";

    return (
      <div className={`flex items-center gap-1.5 font-mono text-xs font-black ${
        isUrgent ? "text-rose-400" : "text-amber-400"
      }`}>
        <span className="flex items-center gap-1 text-[10px] uppercase font-sans font-bold tracking-wider text-[#7e8ea9] mr-0.5">
          <Clock className="w-3 h-3 text-[#ff5238]" />
          <span>Airs in:</span>
        </span>
        <div className="flex items-center gap-1">
          <span className="bg-[#121624] border border-[#232c42] px-1.5 py-0.5 rounded-md">
            {String(timeLeft.days).padStart(2, "0")}d
          </span>
          <span>:</span>
          <span className="bg-[#121624] border border-[#232c42] px-1.5 py-0.5 rounded-md">
            {String(timeLeft.hours).padStart(2, "0")}h
          </span>
          <span>:</span>
          <span className="bg-[#121624] border border-[#232c42] px-1.5 py-0.5 rounded-md">
            {String(timeLeft.minutes).padStart(2, "0")}m
          </span>
          <span>:</span>
          <span className="bg-[#121624] border border-[#232c42] px-1.5 py-0.5 rounded-md text-[#ff5238]">
            {String(timeLeft.seconds).padStart(2, "0")}s
          </span>
        </div>
      </div>
    );
  }

  // Fallback for month or season
  if (targetTimestamp && (datePrecision === "month" || datePrecision === "season")) {
    const d = new Date(targetTimestamp);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return (
      <div className="text-xs font-semibold text-[#8ca0c2] flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-[#ff5238]" />
        <span>Target: <strong className="text-white font-bold">{label}</strong></span>
      </div>
    );
  }

  return (
    <div className="text-xs font-medium text-[#70809e] flex items-center gap-1.5">
      <Bell className="w-3.5 h-3.5 text-[#ff5238]" />
      <span>Official Announcement • Date TBA</span>
    </div>
  );
}
