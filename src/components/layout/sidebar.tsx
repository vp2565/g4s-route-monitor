"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  Package,
  AlertTriangle,
  Users,
  Cpu,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { href: "/map", label: "Map Console", icon: Map },
  { href: "/shipments", label: "Shipments", icon: Package },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/users", label: "Users", icon: Users },
  { href: "/devices", label: "Devices", icon: Cpu },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isDarkTheme } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col border-r transition-all duration-200",
          collapsed ? "w-16" : "w-56",
          isDarkTheme
            ? "bg-black border-gray-800"
            : "bg-[#111827] border-gray-800"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center border-b border-gray-800 h-14",
            collapsed ? "justify-center px-2" : "px-4"
          )}
        >
          {collapsed ? (
            <span className="text-lg font-bold text-white">
              G<span className="text-g4s-red">4</span>S
            </span>
          ) : (
            <span className="text-lg font-bold text-white tracking-tight">
              G<span className="text-g4s-red">4</span>S{" "}
              <span className="text-gray-400 font-normal">Telematix</span>
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-g4s-red/10 text-g4s-red"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-gray-800 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full text-gray-400 hover:text-white hover:bg-gray-800",
              collapsed && "px-2"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
