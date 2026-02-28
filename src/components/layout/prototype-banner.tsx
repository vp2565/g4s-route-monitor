"use client";

import { AlertTriangle } from "lucide-react";

export function PrototypeBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-g4s-red px-4 py-1.5 text-xs font-semibold text-white tracking-wide">
      <AlertTriangle className="h-3.5 w-3.5" />
      PROTOTYPE — SIMULATED DATA
      <AlertTriangle className="h-3.5 w-3.5" />
    </div>
  );
}
