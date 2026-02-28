"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ShipmentsPage() {
  const { isDarkTheme } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Shipments"
        description="Track and manage all shipments across your network"
      >
        <Button asChild size="sm">
          <Link href="/shipments/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Shipment
          </Link>
        </Button>
      </PageHeader>
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
              Shipment List
            </h2>
            <p
              className={cn(
                "text-sm mt-1",
                isDarkTheme ? "text-gray-500" : "text-gray-400"
              )}
            >
              25 shipments across all lifecycle states — coming in Session 3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
