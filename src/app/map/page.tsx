"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

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

const SOCConsole = dynamic(
  () => import("@/components/soc/SOCConsole"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    ),
  }
);

export default function MapPage() {
  const { isSOCOperator } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {isSOCOperator ? <SOCConsole /> : <MapConsole />}
    </div>
  );
}
