"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/contexts/auth-context";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
  const { isDarkTheme } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Alert Inbox"
        description="Active alerts across all monitored shipments"
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle
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
              Alert Inbox
            </h2>
            <p
              className={cn(
                "text-sm mt-1",
                isDarkTheme ? "text-gray-500" : "text-gray-400"
              )}
            >
              20 alerts with SLA timers, severity levels, and SOC playbook
              binding — coming in Session 3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
