"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Map, Radio, Shield } from "lucide-react";

export default function MapPage() {
  const { isSOCOperator, isDarkTheme } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={isSOCOperator ? "SOC Console" : "Map Console"}
        description={
          isSOCOperator
            ? "24/7 Secure Operations Center — Real-time monitoring across all customers"
            : "Live shipment tracking and route visualization"
        }
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          {isSOCOperator ? (
            <Shield className="h-16 w-16 mx-auto text-g4s-red/30" />
          ) : (
            <Map
              className={cn(
                "h-16 w-16 mx-auto",
                isDarkTheme ? "text-gray-600" : "text-gray-300"
              )}
            />
          )}
          <div>
            <h2
              className={cn(
                "text-lg font-semibold",
                isDarkTheme ? "text-gray-300" : "text-gray-600"
              )}
            >
              {isSOCOperator ? "SOC Console" : "Map Console"}
            </h2>
            <p
              className={cn(
                "text-sm mt-1",
                isDarkTheme ? "text-gray-500" : "text-gray-400"
              )}
            >
              {isSOCOperator
                ? "Three-panel SOC console with alert queue, live map, and playbook dispatch — coming in Session 2"
                : "Interactive map with live shipment tracking — coming in Session 2"}
            </p>
          </div>
          {isSOCOperator && (
            <div className="flex items-center justify-center gap-2 text-xs text-g4s-red/60">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>LIVE — 24/7 Operations</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
