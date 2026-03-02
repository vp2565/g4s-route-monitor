"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/contexts/auth-context";
import { getAllAlerts } from "@/lib/store";
import { AlertTable } from "@/components/alerts/AlertTable";

const USER_CUSTOMER_MAP: Record<string, string> = {
  "usr-002": "cust-001",
  "usr-003": "cust-003",
};

export default function AlertsPage() {
  const { user, isDarkTheme } = useAuth();

  const customerScope = user ? USER_CUSTOMER_MAP[user.id] ?? null : null;
  const isCustomerScoped =
    user?.role === "customer_admin" || user?.role === "customer_user";

  const alerts = useMemo(() => {
    const all = getAllAlerts();
    if (isCustomerScoped && customerScope) {
      return all.filter((a) => a.customerId === customerScope);
    }
    return all;
  }, [isCustomerScoped, customerScope]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Alert Inbox"
        description="Active alerts across all monitored shipments"
      />
      <div className="flex-1 overflow-hidden p-4">
        <AlertTable
          alerts={alerts}
          isDark={isDarkTheme}
          hideCustomerFilter={isCustomerScoped}
        />
      </div>
    </div>
  );
}
