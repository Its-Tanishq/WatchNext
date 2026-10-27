"use client";

import {
  Play,
  CheckCircle2,
  Calendar,
  PauseCircle,
  XCircle,
  Library,
  Star,
  Radio,
  Clock,
  Sparkles,
} from "lucide-react";

export default function StatusIcon({ status, className = "w-4 h-4" }) {
  switch (status) {
    case "CURRENT":
      return <Play className={className} />;
    case "COMPLETED":
      return <CheckCircle2 className={className} />;
    case "PLANNING":
      return <Calendar className={className} />;
    case "PAUSED":
      return <PauseCircle className={className} />;
    case "DROPPED":
      return <XCircle className={className} />;
    case "FAVOURITES":
      return <Star className={className} />;
    case "RADAR":
      return <Radio className={className} />;
    case "UPCOMING":
      return <Clock className={className} />;
    case "RECOMMENDED":
      return <Sparkles className={className} />;
    case "ALL":
    default:
      return <Library className={className} />;
  }
}
