"use client";

import { useAuth } from "@/contexts/auth-context";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { PrototypeBanner } from "./prototype-banner";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isDarkTheme } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden",
        isDarkTheme ? "bg-black text-gray-100" : "bg-white text-gray-900"
      )}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <PrototypeBanner />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
