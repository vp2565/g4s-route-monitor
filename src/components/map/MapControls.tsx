"use client";

import { Layers, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  isDark: boolean;
  tileLayer: "standard" | "dark";
  onToggleLayer: () => void;
  onZoomToFit: () => void;
}

export function MapControls({
  isDark,
  tileLayer,
  onToggleLayer,
  onZoomToFit,
}: MapControlsProps) {
  const btnClass = cn(
    "flex items-center justify-center w-8 h-8 rounded shadow-md border transition-colors",
    isDark
      ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
  );

  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={onToggleLayer}
        className={btnClass}
        title={`Switch to ${tileLayer === "standard" ? "dark" : "standard"} tiles`}
      >
        <Layers className="h-4 w-4" />
      </button>
      <button
        onClick={onZoomToFit}
        className={btnClass}
        title="Zoom to fit all shipments"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}
