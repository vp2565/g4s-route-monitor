"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Alert, AlertSeverity, AlertType, AlertStatus } from "@/lib/types";
import { getAllCustomers } from "@/lib/store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SEVERITY_COLORS,
  SEVERITY_BG,
  STATUS_PILL_STYLES,
  ALERT_TYPE_ICONS,
  formatAlertType,
  formatAlertDate,
  isAlertActive,
} from "@/lib/alert-utils";
import { SLACountdown } from "@/components/alerts/SLACountdown";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertTableProps {
  alerts: Alert[];
  isDark: boolean;
  hideCustomerFilter?: boolean;
}

type SortField =
  | "severity"
  | "type"
  | "shipmentRef"
  | "customerName"
  | "locationName"
  | "triggeredAt"
  | "slaDeadline"
  | "status";
type SortDir = "asc" | "desc";

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const ALL_SEVERITIES: AlertSeverity[] = ["critical", "high", "medium", "low"];

const ALL_STATUSES: AlertStatus[] = [
  "new",
  "acknowledged",
  "investigating",
  "dispatched",
  "resolved",
  "closed",
  "false_alarm",
];

const ALL_TYPES: AlertType[] = [
  "route_deviation",
  "geofence_breach",
  "unauthorized_stop",
  "temperature_breach",
  "humidity_breach",
  "shock_detected",
  "light_exposure",
  "door_open",
  "signal_loss",
  "battery_low",
  "late_departure",
  "eta_exceeded",
  "tampering",
];

export function AlertTable({ alerts, isDark, hideCustomerFilter }: AlertTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>("triggeredAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const customers = useMemo(() => getAllCustomers(), []);

  // Filter
  const filtered = useMemo(() => {
    return alerts.filter((a) => {
      if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
      if (filterType !== "all" && a.type !== filterType) return false;
      if (filterCustomer !== "all" && a.customerId !== filterCustomer) return false;
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.id.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          a.shipmentRef.toLowerCase().includes(q) ||
          a.locationName.toLowerCase().includes(q) ||
          a.customerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [alerts, filterSeverity, filterType, filterCustomer, filterStatus, search]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "severity":
          cmp = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "shipmentRef":
          cmp = a.shipmentRef.localeCompare(b.shipmentRef);
          break;
        case "customerName":
          cmp = a.customerName.localeCompare(b.customerName);
          break;
        case "locationName":
          cmp = a.locationName.localeCompare(b.locationName);
          break;
        case "triggeredAt":
          cmp = new Date(a.triggeredAt).getTime() - new Date(b.triggeredAt).getTime();
          break;
        case "slaDeadline":
          cmp = new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime();
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  // Reset page when filters change
  useEffect(() => setPage(0), [filterSeverity, filterType, filterCustomer, filterStatus, search, pageSize]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  }

  function exportCSV() {
    const headers = ["ID", "Severity", "Type", "Shipment", "Customer", "Location", "Triggered", "SLA Deadline", "Status"];
    const rows = sorted.map((a) => [
      a.id,
      a.severity,
      formatAlertType(a.type),
      a.shipmentRef,
      a.customerName,
      a.locationName,
      a.triggeredAt,
      a.slaDeadline,
      a.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alerts.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger
            className={cn("w-[130px] h-8 text-xs", isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-300")}
          >
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            {ALL_SEVERITIES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger
            className={cn("w-[160px] h-8 text-xs", isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-300")}
          >
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ALL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {formatAlertType(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!hideCustomerFilter && (
          <Select value={filterCustomer} onValueChange={setFilterCustomer}>
            <SelectTrigger
              className={cn("w-[160px] h-8 text-xs", isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-300")}
            >
              <SelectValue placeholder="All Customers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers
                .filter((c) => c.id !== "cust-g4s")
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.shortCode}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger
            className={cn("w-[150px] h-8 text-xs", isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-300")}
          >
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[180px] max-w-[280px]">
          <Search
            className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5", isDark ? "text-gray-500" : "text-gray-400")}
          />
          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full h-8 pl-8 pr-3 text-xs rounded-md border outline-none",
              isDark ? "bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500" : "bg-white border-gray-300 placeholder:text-gray-400"
            )}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
            {filtered.length} alert{filtered.length !== 1 ? "s" : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-8 text-xs", isDark && "border-gray-700 text-gray-300 hover:bg-gray-800")}
            onClick={exportCSV}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border" style={{ borderColor: isDark ? "#374151" : "#e5e7eb" }}>
        <Table>
          <TableHeader>
            <TableRow
              className={cn(isDark ? "bg-gray-800/70 border-gray-700 hover:bg-gray-800/70" : "bg-gray-50 hover:bg-gray-50")}
            >
              {(
                [
                  ["severity", "Severity"],
                  ["type", "Type"],
                  ["shipmentRef", "Shipment"],
                  ["customerName", "Customer"],
                  ["locationName", "Location"],
                  ["triggeredAt", "Triggered"],
                  ["slaDeadline", "SLA"],
                  ["status", "Status"],
                ] as [SortField, string][]
              ).map(([field, label]) => (
                <TableHead
                  key={field}
                  className={cn("text-xs cursor-pointer select-none whitespace-nowrap", isDark ? "text-gray-400" : "text-gray-500")}
                  onClick={() => toggleSort(field)}
                >
                  <span className="flex items-center">
                    {label}
                    <SortIcon field={field} />
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className={cn("text-center py-12 text-sm", isDark ? "text-gray-500" : "text-gray-400")}
                >
                  No alerts match your filters
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((alert) => {
                const Icon = ALERT_TYPE_ICONS[alert.type] || AlertTriangle;
                const sevColor = SEVERITY_COLORS[alert.severity];
                const sevBg = SEVERITY_BG[alert.severity];
                const pill = STATUS_PILL_STYLES[alert.status] ?? STATUS_PILL_STYLES.new;
                const active = isAlertActive(alert.status);

                return (
                  <TableRow
                    key={alert.id}
                    className={cn(
                      "cursor-pointer",
                      isDark ? "border-gray-800 hover:bg-gray-800/50" : "hover:bg-gray-50",
                      !active && "opacity-60"
                    )}
                    onClick={() => router.push(`/alerts/${alert.id}`)}
                  >
                    {/* Severity */}
                    <TableCell>
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase", isDark ? sevBg.dark : sevBg.light)}>
                        <Icon size={12} style={{ color: sevColor }} />
                        {alert.severity}
                      </span>
                    </TableCell>

                    {/* Type */}
                    <TableCell className={cn("text-xs", isDark ? "text-gray-300" : "text-gray-700")}>
                      {formatAlertType(alert.type)}
                    </TableCell>

                    {/* Shipment */}
                    <TableCell className="text-xs font-medium">
                      <Link
                        href={`/shipments/${alert.shipmentId}`}
                        className={cn("hover:underline", isDark ? "text-blue-400" : "text-blue-600")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {alert.shipmentRef}
                      </Link>
                    </TableCell>

                    {/* Customer */}
                    <TableCell className={cn("text-xs", isDark ? "text-gray-300" : "text-gray-700")}>
                      {alert.customerName}
                    </TableCell>

                    {/* Location */}
                    <TableCell className={cn("text-xs", isDark ? "text-gray-300" : "text-gray-700")}>
                      {alert.locationName}
                    </TableCell>

                    {/* Triggered */}
                    <TableCell className={cn("text-xs whitespace-nowrap", isDark ? "text-gray-300" : "text-gray-700")}>
                      {formatAlertDate(alert.triggeredAt)}
                    </TableCell>

                    {/* SLA */}
                    <TableCell>
                      {active ? (
                        <SLACountdown deadline={alert.slaDeadline} breached={alert.slaBreached} isDark={isDark} />
                      ) : (
                        <span className={cn("text-[10px]", isDark ? "text-gray-500" : "text-gray-400")}>
                          {alert.slaBreached ? "Breached" : "Met"}
                        </span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm whitespace-nowrap"
                        style={{ backgroundColor: pill.bg, color: pill.text }}
                      >
                        {pill.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>Rows per page:</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger
              className={cn("w-[65px] h-7 text-xs", isDark ? "bg-gray-800 border-gray-700 text-gray-200" : "bg-white border-gray-300")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-7 text-xs px-2", isDark && "border-gray-700 text-gray-300 hover:bg-gray-800")}
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-7 text-xs px-2", isDark && "border-gray-700 text-gray-300 hover:bg-gray-800")}
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
