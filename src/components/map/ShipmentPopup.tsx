import type { Shipment } from "@/lib/types";

interface ShipmentPopupProps {
  shipment: Shipment;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  in_transit: { bg: "#DCFCE7", text: "#166534" },
  active: { bg: "#DCFCE7", text: "#166534" },
  at_checkpoint: { bg: "#DBEAFE", text: "#1E40AF" },
  delayed: { bg: "#FEF3C7", text: "#92400E" },
  planned: { bg: "#F3F4F6", text: "#374151" },
  ddi_pending: { bg: "#F3F4F6", text: "#374151" },
  completed: { bg: "#F3F4F6", text: "#6B7280" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

const RISK_COLORS: Record<string, string> = {
  low: "#22C55E",
  medium: "#EAB308",
  high: "#F97316",
  critical: "#EF4444",
};

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ShipmentPopup({ shipment }: ShipmentPopupProps) {
  const statusStyle = STATUS_COLORS[shipment.status] ?? STATUS_COLORS.planned;

  return (
    <div style={{ minWidth: 220, fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>{shipment.id}</span>
        <span
          style={{
            fontSize: 11,
            padding: "1px 6px",
            borderRadius: 4,
            backgroundColor: statusStyle.bg,
            color: statusStyle.text,
            fontWeight: 500,
          }}
        >
          {formatStatus(shipment.status)}
        </span>
      </div>

      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
        {shipment.customerName}
      </div>

      <div style={{ fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: "#6B7280" }}>{shipment.origin}</span>
        <span style={{ margin: "0 4px", color: "#9CA3AF" }}>&rarr;</span>
        <span style={{ color: "#374151" }}>{shipment.destination}</span>
      </div>

      {shipment.estimatedArrival && (
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>
          ETA:{" "}
          {new Date(shipment.estimatedArrival).toLocaleString("en-GB", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 11, color: "#6B7280" }}>
          Risk:{" "}
          <span
            style={{
              fontWeight: 600,
              color: RISK_COLORS[shipment.riskLevel] ?? "#6B7280",
            }}
          >
            {shipment.riskScore}/100
          </span>
        </div>
        {shipment.alertCount > 0 && (
          <span
            style={{
              fontSize: 11,
              color: "#EF4444",
              fontWeight: 600,
            }}
          >
            {shipment.alertCount} alert{shipment.alertCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {shipment.progressPercent > 0 && shipment.status !== "completed" && (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              height: 4,
              backgroundColor: "#E5E7EB",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${shipment.progressPercent}%`,
                backgroundColor: "#3B82F6",
                borderRadius: 2,
              }}
            />
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#9CA3AF",
              textAlign: "right",
              marginTop: 2,
            }}
          >
            {shipment.progressPercent}% complete
          </div>
        </div>
      )}

      <a
        href={`/shipments/${shipment.id}`}
        style={{
          display: "block",
          textAlign: "center",
          fontSize: 12,
          fontWeight: 500,
          color: "#C8102E",
          textDecoration: "none",
          padding: "4px 0",
          borderTop: "1px solid #E5E7EB",
        }}
      >
        View Details &rarr;
      </a>
    </div>
  );
}
