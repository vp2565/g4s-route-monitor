"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/contexts/auth-context";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShipmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { isDarkTheme } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`Shipment ${params.id}`}
        description="Detailed shipment view with timeline, map, and sensor data"
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package
            className={cn(
              "h-16 w-16 mx-auto",
              isDarkTheme ? "text-gray-600" : "text-gray-300"
            )}
          />
          <div>
            <h2
              className={cn(
                "text-lg font-semibold",
                isDarkTheme ? "text-gray-300" : "text-gray-600"
              )}
            >
              Shipment Detail View
            </h2>
            <p
              className={cn(
                "text-sm mt-1",
                isDarkTheme ? "text-gray-500" : "text-gray-400"
              )}
            >
              Full shipment detail with multimodal segments, risk scoring, and
              DDI — coming in Session 3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
