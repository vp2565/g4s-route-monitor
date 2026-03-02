"use client";

import Link from "next/link";
import Image from "next/image";
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
            : "bg-gray-50 border-gray-200"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-14 border-b",
            collapsed ? "justify-center px-2" : "px-4",
            isDarkTheme ? "border-gray-800" : "border-gray-200"
          )}
        >
          <Image
            src={isDarkTheme ? "/logo-white.png" : "/logo-black.png"}
            alt="G4S Telematix"
            width={180}
            height={36}
            priority
            className={cn("h-7 w-auto", collapsed && "h-5")}
          />
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
                    : isDarkTheme
                      ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                      : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
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
        <div className={cn("border-t p-2", isDarkTheme ? "border-gray-800" : "border-gray-200")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full",
              isDarkTheme
                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200",
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
