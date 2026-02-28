"use client";

import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  const { isDarkTheme } = useAuth();

  return (
    <div
      className={cn(
        "flex items-center justify-between border-b px-6 py-4",
        isDarkTheme ? "border-gray-800" : "border-gray-200"
      )}
    >
      <div>
        <h1
          className={cn(
            "text-2xl font-semibold tracking-tight",
            isDarkTheme ? "text-gray-100" : "text-gray-900"
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              "text-sm mt-1",
              isDarkTheme ? "text-gray-400" : "text-gray-500"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
