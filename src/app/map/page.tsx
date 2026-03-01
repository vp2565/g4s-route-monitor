"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MapConsole = dynamic(
  () => import("@/components/map/MapConsole"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    ),
  }
);

export default function MapPage() {
  return (
    <div className="flex flex-col h-full">
      <MapConsole />
    </div>
  );
}
