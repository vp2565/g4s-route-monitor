"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/contexts/auth-context";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  const { isDarkTheme } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="User Management"
        description="Manage platform users and role assignments"
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Users
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
              User Management
            </h2>
            <p
              className={cn(
                "text-sm mt-1",
                isDarkTheme ? "text-gray-500" : "text-gray-400"
              )}
            >
              Role-based user management with customer scoping — coming in a
              future session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
