"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Shipment } from "@/lib/types";
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
  displayRiskScore,
  riskScoreBgColor,
  STATUS_COLORS,
  formatStatus,
  MODE_ICONS,
  formatETA,
} from "@/lib/shipment-utils";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShipmentTableProps {
  shipments: Shipment[];
  isDark: boolean;
  hideCustomerFilter?: boolean;
}

type SortField =
  | "id"
  | "customerName"
  | "origin"
  | "status"
  | "mode"
  | "riskScore"
  | "estimatedArrival"
  | "alertCount";
type SortDir = "asc" | "desc";

export function ShipmentTable({
  shipments,
  isDark,
  hideCustomerFilter,
}: ShipmentTableProps) {
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMode, setFilterMode] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const customers = useMemo(() => getAllCustomers(), []);

  // Filter
  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      if (filterCustomer !== "all" && s.customerId !== filterCustomer)
        return false;
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (
        filterMode !== "all" &&
        !s.transportModes.includes(filterMode as Shipment["transportModes"][number])
      )
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.id.toLowerCase().includes(q) ||
          s.routeName.toLowerCase().includes(q) ||
          s.origin.toLowerCase().includes(q) ||
          s.destination.toLowerCase().includes(q) ||
          s.driverName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [shipments, filterCustomer, filterStatus, filterMode, search]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "id":
          cmp = a.id.localeCompare(b.id);
          break;
        case "customerName":
          cmp = a.customerName.localeCompare(b.customerName);
          break;
        case "origin":
          cmp = a.origin.localeCompare(b.origin);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "mode":
          cmp = a.transportModes.join(",").localeCompare(b.transportModes.join(","));
          break;
        case "riskScore":
          cmp = a.riskScore - b.riskScore;
          break;
        case "estimatedArrival":
          cmp =
            new Date(a.estimatedArrival ?? a.scheduledArrival).getTime() -
            new Date(b.estimatedArrival ?? b.scheduledArrival).getTime();
          break;
        case "alertCount":
          cmp = a.alertCount - b.alertCount;
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
  useEffect(() => setPage(0), [filterCustomer, filterStatus, filterMode, search, pageSize]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  }

  function exportCSV() {
    const headers = [
      "ID",
      "Customer",
      "Origin",
      "Destination",
      "Status",
      "Modes",
      "Risk",
      "ETA",
      "Alerts",
    ];
    const rows = sorted.map((s) => [
      s.id,
      s.customerName,
      s.origin,
      s.destination,
      s.status,
      s.transportModes.join("+"),
      displayRiskScore(s.riskScore),
      s.estimatedArrival ?? s.scheduledArrival,
      s.alertCount,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shipments.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        {!hideCustomerFilter && (
          <Select value={filterCustomer} onValueChange={setFilterCustomer}>
            <SelectTrigger
              className={cn(
                "w-[160px] h-8 text-xs",
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-200"
                  : "bg-white border-gray-300"
              )}
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
            className={cn(
              "w-[140px] h-8 text-xs",
              isDark
                ? "bg-gray-800 border-gray-700 text-gray-200"
                : "bg-white border-gray-300"
            )}
          >
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {[
              "planned",
              "ddi_pending",
              "active",
              "in_transit",
              "at_checkpoint",
              "delayed",
              "completed",
              "cancelled",
            ].map((s) => (
              <SelectItem key={s} value={s}>
                {formatStatus(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterMode} onValueChange={setFilterMode}>
          <SelectTrigger
            className={cn(
              "w-[130px] h-8 text-xs",
              isDark
                ? "bg-gray-800 border-gray-700 text-gray-200"
                : "bg-white border-gray-300"
            )}
          >
            <SelectValue placeholder="All Modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            {(["road", "sea", "rail", "air"] as const).map((m) => (
              <SelectItem key={m} value={m}>
                {MODE_ICONS[m]} {m.charAt(0).toUpperCase() + m.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[180px] max-w-[280px]">
          <Search
            className={cn(
              "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5",
              isDark ? "text-gray-500" : "text-gray-400"
            )}
          />
          <input
            type="text"
            placeholder="Search ID, route, driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full h-8 pl-8 pr-3 text-xs rounded-md border outline-none",
              isDark
                ? "bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
                : "bg-white border-gray-300 placeholder:text-gray-400"
            )}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={cn(
              "text-xs",
              isDark ? "text-gray-400" : "text-gray-500"
            )}
          >
            {filtered.length} shipment{filtered.length !== 1 ? "s" : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 text-xs",
              isDark && "border-gray-700 text-gray-300 hover:bg-gray-800"
            )}
            onClick={exportCSV}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border"
        style={{ borderColor: isDark ? "#374151" : "#e5e7eb" }}
      >
        <Table>
          <TableHeader>
            <TableRow
              className={cn(
                isDark
                  ? "bg-gray-800/70 border-gray-700 hover:bg-gray-800/70"
                  : "bg-gray-50 hover:bg-gray-50"
              )}
            >
              {(
                [
                  ["id", "Shipment ID"],
                  ["customerName", "Customer"],
                  ["origin", "Route"],
                  ["status", "Status"],
                  ["mode", "Mode"],
                  ["riskScore", "Risk"],
                  ["estimatedArrival", "ETA"],
                  ["alertCount", "Alerts"],
                ] as [SortField, string][]
              ).map(([field, label]) => (
                <TableHead
                  key={field}
                  className={cn(
                    "text-xs cursor-pointer select-none whitespace-nowrap",
                    isDark ? "text-gray-400" : "text-gray-500"
                  )}
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
                  className={cn(
                    "text-center py-12 text-sm",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  No shipments match your filters
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((s) => {
                const risk = displayRiskScore(s.riskScore);
                const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS.planned;
                return (
                  <TableRow
                    key={s.id}
                    className={cn(
                      "cursor-pointer",
                      isDark
                        ? "border-gray-800 hover:bg-gray-800/50"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <TableCell className="text-xs font-medium">
                      <Link
                        href={`/shipments/${s.id}`}
                        className={cn(
                          "hover:underline",
                          isDark ? "text-blue-400" : "text-blue-600"
                        )}
                      >
                        {s.id}
                      </Link>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-xs",
                        isDark ? "text-gray-300" : "text-gray-700"
                      )}
                    >
                      {s.customerName}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-xs",
                        isDark ? "text-gray-300" : "text-gray-700"
                      )}
                    >
                      <span className="whitespace-nowrap">
                        {s.origin} → {s.destination}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
                          isDark
                            ? `${sc.darkBg} ${sc.darkText}`
                            : `${sc.bg} ${sc.text}`
                        )}
                      >
                        {formatStatus(s.status)}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-xs",
                        isDark ? "text-gray-300" : "text-gray-700"
                      )}
                    >
                      {s.transportModes
                        .map((m) => MODE_ICONS[m] ?? m)
                        .join(" ")}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "text-xs font-bold px-1.5 py-0.5 rounded",
                          riskScoreBgColor(risk, isDark)
                        )}
                      >
                        {risk}/10
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-xs whitespace-nowrap",
                        isDark ? "text-gray-300" : "text-gray-700"
                      )}
                    >
                      {formatETA(s.estimatedArrival ?? s.scheduledArrival)}
                    </TableCell>
                    <TableCell>
                      {s.alertCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                          <AlertTriangle className="h-3 w-3" />
                          {s.alertCount}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "text-xs",
                            isDark ? "text-gray-600" : "text-gray-300"
                          )}
                        >
                          0
                        </span>
                      )}
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
          <span
            className={cn(
              "text-xs",
              isDark ? "text-gray-400" : "text-gray-500"
            )}
          >
            Rows per page:
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger
              className={cn(
                "w-[65px] h-7 text-xs",
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-200"
                  : "bg-white border-gray-300"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs",
              isDark ? "text-gray-400" : "text-gray-500"
            )}
          >
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 text-xs px-2",
              isDark && "border-gray-700 text-gray-300 hover:bg-gray-800"
            )}
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 text-xs px-2",
              isDark && "border-gray-700 text-gray-300 hover:bg-gray-800"
            )}
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
