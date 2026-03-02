"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getAllCustomers } from "@/lib/store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ShipmentDetailsData {
  customerId: string;
  priority: "standard" | "high" | "critical";
  cargoDescription: string;
  cargoValue: string;
  cargoWeight: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  tempMin: string;
  tempMax: string;
  notes: string;
  smpVersion: string;
  ddi: {
    driverVerified: boolean;
    vehicleInspected: boolean;
    sealsApplied: boolean;
    documentsChecked: boolean;
    routeBriefingDone: boolean;
    devicesTested: boolean;
    emergencyContactsConfirmed: boolean;
    communicationsChecked: boolean;
  };
}

interface Step2Props {
  data: ShipmentDetailsData;
  onChange: (data: ShipmentDetailsData) => void;
  isDark: boolean;
  fixedCustomerId?: string;
}

export function Step2ShipmentDetails({
  data,
  onChange,
  isDark,
  fixedCustomerId,
}: Step2Props) {
  const customers = useMemo(
    () => getAllCustomers().filter((c) => c.id !== "cust-g4s"),
    []
  );

  function update(patch: Partial<ShipmentDetailsData>) {
    onChange({ ...data, ...patch });
  }

  function toggleDDI(key: keyof ShipmentDetailsData["ddi"]) {
    onChange({ ...data, ddi: { ...data.ddi, [key]: !data.ddi[key] } });
  }

  const inputCls = cn(
    "w-full h-9 px-3 text-sm rounded-md border outline-none",
    isDark
      ? "bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
      : "bg-white border-gray-300 placeholder:text-gray-400"
  );

  const labelCls = cn(
    "text-xs font-medium mb-1 block",
    isDark ? "text-gray-400" : "text-gray-500"
  );

  return (
    <div className="space-y-5">
      {/* Customer & Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Customer</label>
          {fixedCustomerId ? (
            <div
              className={cn(
                "h-9 px-3 flex items-center text-sm rounded-md border",
                isDark
                  ? "bg-gray-800/50 border-gray-700 text-gray-300"
                  : "bg-gray-50 border-gray-200 text-gray-600"
              )}
            >
              {customers.find((c) => c.id === fixedCustomerId)?.name ??
                fixedCustomerId}
            </div>
          ) : (
            <Select
              value={data.customerId}
              onValueChange={(v) => update({ customerId: v })}
            >
              <SelectTrigger
                className={cn(
                  "h-9 text-sm",
                  isDark
                    ? "bg-gray-800 border-gray-700 text-gray-200"
                    : "bg-white border-gray-300"
                )}
              >
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <label className={labelCls}>Priority</label>
          <Select
            value={data.priority}
            onValueChange={(v) =>
              update({ priority: v as ShipmentDetailsData["priority"] })
            }
          >
            <SelectTrigger
              className={cn(
                "h-9 text-sm",
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-200"
                  : "bg-white border-gray-300"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cargo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-3">
          <label className={labelCls}>Cargo Description</label>
          <input
            className={inputCls}
            placeholder="e.g. 500 cartons of premium cigarettes"
            value={data.cargoDescription}
            onChange={(e) => update({ cargoDescription: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Value (EUR)</label>
          <input
            className={inputCls}
            type="number"
            placeholder="0"
            value={data.cargoValue}
            onChange={(e) => update({ cargoValue: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Weight (kg)</label>
          <input
            className={inputCls}
            type="number"
            placeholder="0"
            value={data.cargoWeight}
            onChange={(e) => update({ cargoWeight: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>SMP Version</label>
          <input
            className={inputCls}
            placeholder="SMP-v3.2"
            value={data.smpVersion}
            onChange={(e) => update({ smpVersion: e.target.value })}
          />
        </div>
      </div>

      {/* Driver / Vehicle */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Driver Name</label>
          <input
            className={inputCls}
            placeholder="Full name"
            value={data.driverName}
            onChange={(e) => update({ driverName: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Driver Phone</label>
          <input
            className={inputCls}
            placeholder="+30 XXX XXX XXXX"
            value={data.driverPhone}
            onChange={(e) => update({ driverPhone: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Vehicle Plate</label>
          <input
            className={inputCls}
            placeholder="AB-1234-CD"
            value={data.vehiclePlate}
            onChange={(e) => update({ vehiclePlate: e.target.value })}
          />
        </div>
      </div>

      {/* Temperature */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Temp Min (°C, optional)</label>
          <input
            className={inputCls}
            type="number"
            placeholder=""
            value={data.tempMin}
            onChange={(e) => update({ tempMin: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Temp Max (°C, optional)</label>
          <input
            className={inputCls}
            type="number"
            placeholder=""
            value={data.tempMax}
            onChange={(e) => update({ tempMax: e.target.value })}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Notes</label>
        <textarea
          className={cn(inputCls, "h-16 py-2 resize-none")}
          placeholder="Additional notes..."
          value={data.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </div>

      {/* DDI Checklist */}
      <div>
        <label className={cn(labelCls, "mb-2")}>
          Driver Departure Interview (DDI)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["driverVerified", "Driver identity verified"],
              ["vehicleInspected", "Vehicle inspected"],
              ["sealsApplied", "Seals applied & recorded"],
              ["documentsChecked", "Documents checked"],
              ["routeBriefingDone", "Route briefing completed"],
              ["devicesTested", "Tracking devices tested"],
              ["emergencyContactsConfirmed", "Emergency contacts confirmed"],
              ["communicationsChecked", "Communications checked"],
            ] as [keyof ShipmentDetailsData["ddi"], string][]
          ).map(([key, label]) => (
            <label
              key={key}
              className={cn(
                "flex items-center gap-2 text-xs cursor-pointer",
                isDark ? "text-gray-300" : "text-gray-600"
              )}
            >
              <input
                type="checkbox"
                checked={data.ddi[key]}
                onChange={() => toggleDDI(key)}
                className="rounded border-gray-400"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
