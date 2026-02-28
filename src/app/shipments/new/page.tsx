"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/contexts/auth-context";
import { PackagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewShipmentPage() {
  const { isDarkTheme } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Create Shipment"
        description="New shipment creation wizard with risk assessment"
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <PackagePlus
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
              Shipment Creation Wizard
            </h2>
            <p
              className={cn(
                "text-sm mt-1",
                isDarkTheme ? "text-gray-500" : "text-gray-400"
              )}
            >
              Multi-step wizard with route selection, device assignment, and risk
              scoring — coming in Session 4
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
