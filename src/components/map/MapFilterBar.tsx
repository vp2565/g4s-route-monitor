"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MapFilters {
  customer: string;
  status: string;
  mode: string;
  search: string;
}

export interface GeofenceFilters {
  showNoGoZones: boolean;
  showSafeParking: boolean;
  showCustomerSites: boolean;
  showHeatmap: boolean;
}

interface MapFilterBarProps {
  filters: MapFilters;
  onFilterChange: (filters: MapFilters) => void;
  geofenceFilters: GeofenceFilters;
  onGeofenceFilterChange: (filters: GeofenceFilters) => void;
  isDark: boolean;
}

const CUSTOMERS = [
  { value: "all", label: "All Customers" },
  { value: "cust-001", label: "BAT" },
  { value: "cust-002", label: "PharmaCo" },
  { value: "cust-003", label: "TechElectronics" },
];

const STATUSES = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "delayed", label: "Delayed" },
  { value: "completed", label: "Completed" },
  { value: "planned", label: "Planned" },
];

const MODES = [
  { value: "all", label: "All Modes" },
  { value: "road", label: "Road" },
  { value: "sea", label: "Sea" },
  { value: "rail", label: "Rail" },
  { value: "air", label: "Air" },
];

export function MapFilterBar({
  filters,
  onFilterChange,
  geofenceFilters,
  onGeofenceFilterChange,
  isDark,
}: MapFilterBarProps) {
  const selectClass = cn(
    "h-8 px-2 text-sm rounded border appearance-none cursor-pointer",
    isDark
      ? "bg-gray-800 border-gray-700 text-gray-200"
      : "bg-white border-gray-300 text-gray-700"
  );

  const toggleBtn = (
    active: boolean,
    color: string,
    label: string,
    onClick: () => void
  ) => (
    <button
      onClick={onClick}
      className={cn(
        "h-7 px-2 text-[11px] rounded border font-medium transition-colors",
        active
          ? `border-transparent text-white`
          : isDark
            ? "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
            : "bg-white border-gray-300 text-gray-500 hover:text-gray-700"
      )}
      style={active ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  );

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 border-b shrink-0",
        isDark ? "bg-gray-900 border-gray-800" : "bg-gray-50 border-gray-200"
      )}
    >
      <select
        value={filters.customer}
        onChange={(e) =>
          onFilterChange({ ...filters, customer: e.target.value })
        }
        className={selectClass}
      >
        {CUSTOMERS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) =>
          onFilterChange({ ...filters, status: e.target.value })
        }
        className={selectClass}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={filters.mode}
        onChange={(e) =>
          onFilterChange({ ...filters, mode: e.target.value })
        }
        className={selectClass}
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      <div className="relative flex-1 max-w-xs">
        <Search
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5",
            isDark ? "text-gray-500" : "text-gray-400"
          )}
        />
        <input
          type="text"
          placeholder="Search shipment ID, plate..."
          value={filters.search}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
          className={cn(
            "h-8 w-full pl-7 pr-2 text-sm rounded border",
            isDark
              ? "bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
              : "bg-white border-gray-300 text-gray-700 placeholder:text-gray-400"
          )}
        />
      </div>

      {/* Divider */}
      <div className={cn("w-px h-6", isDark ? "bg-gray-700" : "bg-gray-300")} />

      {/* Geofence toggles */}
      <div className="flex items-center gap-1.5">
        {toggleBtn(
          geofenceFilters.showNoGoZones,
          "#EF4444",
          "No-Go",
          () => onGeofenceFilterChange({ ...geofenceFilters, showNoGoZones: !geofenceFilters.showNoGoZones })
        )}
        {toggleBtn(
          geofenceFilters.showSafeParking,
          "#22C55E",
          "Safe Park",
          () => onGeofenceFilterChange({ ...geofenceFilters, showSafeParking: !geofenceFilters.showSafeParking })
        )}
        {toggleBtn(
          geofenceFilters.showCustomerSites,
          "#3B82F6",
          "Sites",
          () => onGeofenceFilterChange({ ...geofenceFilters, showCustomerSites: !geofenceFilters.showCustomerSites })
        )}
        {toggleBtn(
          geofenceFilters.showHeatmap,
          "#F97316",
          "Heatmap",
          () => onGeofenceFilterChange({ ...geofenceFilters, showHeatmap: !geofenceFilters.showHeatmap })
        )}
      </div>
    </div>
  );
}
