"use client";

import { Bell, Search, LogOut, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { DEMO_USERS, ROLE_STYLES, UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function TopBar() {
  const { user, switchRole, logout, isDarkTheme } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <header
      className={cn(
        "flex items-center h-14 border-b px-4 gap-4",
        isDarkTheme
          ? "bg-black border-gray-800"
          : "bg-white border-gray-200"
      )}
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
              isDarkTheme ? "text-gray-500" : "text-gray-400"
            )}
          />
          <Input
            placeholder="Search shipments, alerts, devices..."
            className={cn(
              "pl-9 h-9",
              isDarkTheme
                ? "bg-gray-900 border-gray-700 text-gray-200 placeholder:text-gray-500"
                : "bg-gray-50 border-gray-200"
            )}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            isDarkTheme
              ? "text-gray-400 hover:text-white hover:bg-gray-800"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-g4s-red text-[10px] font-bold text-white">
            3
          </span>
        </Button>

        {/* Role badge */}
        <span
          className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold"
          style={ROLE_STYLES[user.role]}
        >
          {user.roleLabel}
        </span>

        {/* User dropdown / role switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex items-center gap-2 px-2",
                isDarkTheme
                  ? "text-gray-300 hover:text-white hover:bg-gray-800"
                  : "text-gray-700 hover:text-gray-900"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  className={cn(
                    "text-xs font-semibold",
                    isDarkTheme
                      ? "bg-gray-800 text-gray-200"
                      : "bg-gray-200 text-gray-700"
                  )}
                >
                  {user.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:inline">
                {user.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-h-[80vh] overflow-y-auto" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">{user.customer}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Switch Role
            </DropdownMenuLabel>
            {DEMO_USERS.map((demoUser) => (
              <DropdownMenuItem
                key={demoUser.id}
                onClick={() => switchRole(demoUser.role as UserRole)}
                className={cn(
                  "cursor-pointer",
                  user.role === demoUser.role && "bg-accent"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-gray-200 text-gray-700">
                      {demoUser.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{demoUser.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {demoUser.roleLabel}
                    </p>
                  </div>
                  {user.role === demoUser.role && (
                    <div className="h-2 w-2 rounded-full bg-g4s-red" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="cursor-pointer text-g4s-red"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
