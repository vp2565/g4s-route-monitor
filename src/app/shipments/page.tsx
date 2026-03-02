"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getAllShipments } from "@/lib/store";
import { ShipmentTable } from "@/components/shipments/ShipmentTable";

const USER_CUSTOMER_MAP: Record<string, string> = {
  "usr-002": "cust-001",
  "usr-003": "cust-003",
};

export default function ShipmentsPage() {
  const { user, isDarkTheme } = useAuth();

  const customerScope = user ? USER_CUSTOMER_MAP[user.id] ?? null : null;
  const isCustomerScoped =
    user?.role === "customer_admin" || user?.role === "customer_user";

  const shipments = useMemo(() => {
    const all = getAllShipments();
    if (isCustomerScoped && customerScope) {
      return all.filter((s) => s.customerId === customerScope);
    }
    return all;
  }, [isCustomerScoped, customerScope]);

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
      <div className="flex-1 overflow-hidden p-4">
        <ShipmentTable
          shipments={shipments}
          isDark={isDarkTheme}
          hideCustomerFilter={isCustomerScoped}
        />
      </div>
    </div>
  );
}
