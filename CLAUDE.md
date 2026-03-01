# G4S Telematix — Route Monitoring Platform Prototype

## Project Overview

This is a **high-fidelity functional prototype** for the G4S Telematix Route Monitoring Platform, built to replace the current Kaptura/Roambee third-party system. G4S Telematix is the Athens-based telematics division of G4S/Allied Universal — the Greek market leader with a pan-European presence across 40 countries.

**Key stats:** 50,000+ fleet management connections, 900,000+ e-call connections, 1,000,000+ stolen vehicle recovery connections, 20+ years of telematics experience, 24/7 Secure Operations Center (SOC).

## What Makes G4S Unique (Critical for Design Decisions)

Unlike competitors (Overhaul, Tive, Roambee), G4S can:
- **Dispatch its own physical security personnel** — patrol units with GPS tracking
- **Coordinate with law enforcement** across 40 countries through formal liaison channels
- **Execute SOC playbooks** — step-by-step response procedures with SLA timers
- **Verify physical handoffs** at multimodal transition points (truck → port)
- **Provide risk advisory** backed by 20+ years of operational incident data

No software-only competitor can replicate these capabilities. The prototype must make them visible at every interaction point.

## Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Mapping:** Leaflet + OpenStreetMap (NO API key needed)
- **Charts:** Recharts
- **Backend:** Next.js API Routes
- **Database:** In-memory JSON seed files (no external DB)
- **Real-time:** Server-Sent Events (SSE) for GPS simulation
- **Auth:** Mock role-switching (no real auth provider)
- **Deployment:** Vercel (free tier)

## Design Principles

- **Map-first:** The map console is the centerpiece. All other views are accessible from map context.
- **Role-adaptive UI:** 6 roles see different experiences from the same platform.
- **SOC-operator-first:** The SOC console is the hero screen. Dark theme, maximum data density, keyboard shortcuts.
- **Sub-3-clicks:** Never more than 3 clicks to any action.
- **Progressive disclosure:** Summary first, details on demand.
- **2025 enterprise SaaS standards:** Clean data tables, professional typography, accessible color system (WCAG AA).
- **Tive-style alert pills:** Dark Red (not started), Pale Red (in progress), Green (resolved), Gray (completed).
- **Overhaul-inspired DDI:** Driver Departure Interview workflow for pre-departure security.
- **Decklar-inspired risk scores:** Prescriptive next-action recommendations, not just descriptive alerts.

## User Roles (6 total)

1. **SOC Operator** — Sees all customers, all shipments. Has the unique three-panel SOC console (alert queue / map / playbook+dispatch). Dark theme. Can acknowledge, escalate, dispatch, resolve.
2. **Customer Admin** — Sees only their customer's data. Can manage users, view alerts (read-only by default), configure notification rules, generate reports.
3. **Customer User (Dispatcher)** — Creates shipments, assigns devices, monitors active shipments. No alert handling.
4. **Field User** — Mobile-optimized view. Device assignment, health checks, DDI forms, proof-of-delivery upload.
5. **OEM Partner** — Read-only branded tracking view via shareable URL. Sees only tagged consignments.
6. **G4S Admin** — Full platform access including configuration and user management across all customers.

## Data Model (Key Entities)

- **Customer** — Hierarchical: G4S → OpCo → Customer → Subsidiary
- **User** — Role-based with customer scoping
- **RouteTemplate** — GeoJSON polylines, risk scores, no-go zones, safe parking
- **Shipment** — DDI fields, risk score, dynamic ETA, SMP version, multimodal segments
- **Segment** — Per-leg of multimodal journey, device assignment, mode-specific reporting rates
- **Device** — Multi-vendor, battery, health check, sensor bundle (temp/humidity/shock/light)
- **Alert** — SLA timers, severity, recommended action, SOC playbook binding
- **SOCPlaybook** — Step-by-step response procedures with escalation tiers (G4S UNIQUE)
- **FieldResponse** — Dispatch, arrival, evidence collection, outcome tracking (G4S UNIQUE)
- **RiskAssessment** — Route-level risk scoring from operational intelligence (G4S UNIQUE)
- **AuditEntry** — Immutable log of all actions

## Seed Data Requirements

- 3 customers: British American Tobacco (BAT), PharmaCo Europe, TechElectronics GmbH
- 6 demo users (one per role)
- 8 European route templates with real GeoJSON coordinates
- 25 shipments across all lifecycle states
- 45 devices with varying battery/health status
- 20 alerts across severity levels and lifecycle states
- 3 SOC playbooks (Theft/Deviation, Cold Chain Breach, Signal Loss)
- Shipment IDs follow pattern: G4S-SHP-2026-XXXX

## Demo Scenarios (What This Must Support)

1. **Live Operations Overview** — SOC operator monitors 12 shipments across 6 countries
2. **Shipment Creation with Risk Assessment** — Create multimodal Athens→Rotterdam shipment, see risk score
3. **Alert Response with Field Dispatch** — Route deviation triggers alert → SOC playbook → field dispatch
4. **Multimodal Journey with Mode Handoff** — Track shipment across road → sea → road segments
5. **Role-Based Access** — Switch between 5 roles showing different experiences

## Pages / Routes

- `/` — Login page with demo user cards
- `/map` — Map console (primary view) / SOC console (when role = SOC Operator)
- `/shipments` — Shipment list
- `/shipments/[id]` — Shipment detail
- `/shipments/new` — Shipment creation wizard
- `/alerts` — Alert inbox
- `/users` — User management
- `/devices` — Device management (placeholder)
- `/reports` — Reports & dashboards (placeholder)
- `/tracking/[token]` — OEM partner shared tracking link (read-only)

## Current Status

This file is updated after each session to track progress. See below.

### Completed Sessions
- **Session 1: Project Scaffolding** — Next.js 14 (App Router) + Tailwind CSS + shadcn/ui. AuthContext with role switching, dark sidebar (collapsible, Lucide icons), top bar with search/notifications/role-switcher dropdown, G4S-red prototype banner, login page with 6 demo user cards. Placeholder pages for all routes. G4S corporate branding (#C8102E red, black, white). Dark theme (black) for internal roles (SOC, Field, G4S Admin); light theme (white) for external roles (Customer Admin, Dispatcher, OEM Partner).
- **Session 2: Data Layer & Seed Data** — Complete typed data layer with 13 entity interfaces (src/lib/types.ts, 452 lines). 12 JSON seed data files in src/lib/data/: 3 customers, 6 users, 8 route templates (real European GeoJSON coordinates), 25 shipments (5 planned, 12 active, 5 completed, 3 with alerts), 28 segments (multimodal support), 45 devices (4 vendors, 4 types, varying battery/status), 20 alerts (all severity levels and lifecycle states), 3 SOC playbooks (Theft/Deviation 6 steps, Cold Chain 5 steps, Signal Loss 4 steps), 2 field responses, 5 risk assessments, 5 condition data records (time-series temp/humidity with breach events), 55 audit entries. Typed data store (src/lib/store.ts) with 30+ accessor functions. Build passes clean.
- **Session 3: Map Console Core** — Full-screen Leaflet map (react-leaflet 4.2.1, dynamically imported ssr:false). 15 shipment CircleMarkers with color coding (green=on-schedule, yellow=at-risk/delayed, red=active-alerts, gray=completed). Color legend bottom-left. Filter bar with customer/status/mode/search dropdowns. Summary strip with live counts. Multimodal route rendering: OSRM road-snapped polylines for land segments, predefined shipping lane waypoints for sea segments (Piraeus→Rotterdam via Mediterranean/Gibraltar/Atlantic, Lübeck→Trelleborg across Baltic), great circle arc fallback for unknown port pairs. Distinct line styles per mode (road=dashed, sea=short-dash blue, air=long-dash). Popup shows shipment ID, customer, status badge, driver, plate, origin→destination, ETA, risk score, progress bar, "View Details" link. Layer toggle (OSM standard / CartoDB dark, auto-selected per role theme). Zoom-to-fit control. Customer-scoped filtering for customer_admin/customer_user roles. Auth state persisted to sessionStorage (survives refresh). Sidebar theme-aware: light (gray-50) for external roles, dark (black) for internal roles. Dropdown z-index fixed to render above Leaflet map.

- **Session 4: Map Console Advanced** — Side panel, breadcrumbs, geofences, heatmap, position system, and code cleanup.
  - **Side Panel** (400px flex sibling, not overlay — map stays interactive): 5 shadcn Tabs — Overview (status badge, cargo value/weight, driver/phone/plate, ETA, progress bar, risk score, DDI summary, transport modes), Route (waypoints table, distance/duration/countries, deviation count), Alerts (severity pills with dark-red/red/yellow/gray, SLA status), Devices (battery bar green>50/yellow>20/red, signal bar, sensor dots), Audit (timeline with color-coded action dots, last 20 entries). Panel opens on marker click, closes on X/map click. MapResizer invalidates map size on panel toggle.
  - **GPS Breadcrumbs** (breadcrumbUtils.ts): Simulated GPS trail along planned route up to progressPercent. Cumulative Haversine distance, interpolated cut point, deterministic LCG+Box-Muller gaussian noise (~15m GPS accuracy), 0-2 deliberate detour zones (1.5-3km lateral offset, smooth ramp in/out). Seeded by shipment ID hash for stable renders.
  - **Deviation Detection** (deviationUtils.ts): For each actual-path point, finds min distance to planned path. Points >1km threshold marked as deviating. Consecutive deviating points clustered within 2km, centroid emitted as red CircleMarker with tooltip.
  - **Geofence Overlays** (GeofenceOverlays.tsx): No-go zones (red dashed semi-transparent Polygons with Tooltip), safe parking (green 800m Circles with name/security), customer sites (blue CircleMarkers for origin/destination).
  - **Risk Heatmap** (RiskHeatmap.tsx): Dynamic import of leaflet.heat, 27 hardcoded corridor heat points (Serbian A1 0.85-0.90, N.Macedonia border 0.70, Greek-Bulgarian border 0.65, German-Polish border 0.42, Piraeus port 0.55), green→yellow→orange→red gradient, radius 35, blur 25.
  - **Filter Bar** extended with 4 geofence toggle buttons (No-Go red, Safe Park green, Sites blue, Heatmap orange) with colored active states.
  - **Position System**: Two-phase route rendering — instant fallback from local GeoJSON coords (30-40 points), then OSRM road-snapped upgrade (thousands of points following real roads). OSRM results cached in osrmCacheRef keyed by route ID. Blob positions computed via Haversine-based interpolation at progressPercent. Once OSRM is cached for a route, all shipments on that route automatically use accurate road-snapped positions (osrmCacheVersion state triggers recomputation). Eliminated the blob "jump" problem where overview and selected positions diverged.
  - **Multimodal Position Fix**: Route coordinates array covers entire journey including sea portions. buildFallbackSegments splits at port locations using findClosestIndex for land/sea segment separation.
  - **Popup → Tooltip**: Replaced heavy Popup with lightweight hover Tooltip (shipment ID only). Full details now in side panel.
  - **Legend**: Dynamically adds contextual entries (Actual Path, Deviation, No-Go Zone, Safe Parking) when overlays are active.
  - **Code Cleanup**: Extracted shared mapUtils.ts (haversine, STATUS_COLORS, formatStatus) to eliminate 3x haversine and 2x status duplication across files. Inlined trivial buildFullPathFromRoute. Simplified selectedFullPath with flatMap.
  - **New files**: mapUtils.ts, breadcrumbUtils.ts, deviationUtils.ts, GeofenceOverlays.tsx, RiskHeatmap.tsx, ShipmentSidePanel.tsx, SidePanelTabs/ (OverviewTab, RouteTab, AlertsTab, DevicesTab, AuditTab).
  - **Key architectural decisions**: Side panel is flex sibling (not Sheet overlay). Breadcrumbs are simulated (no real GPS history). Heatmap uses hardcoded corridor points. OSRM cache is progressive — improves as user interacts.

- **Session 5: SOC Operator Console** — Three-panel command center replacing standard map when role=soc_operator. Dark theme (bg-slate-950) throughout.
  - **Alert Queue** (300px left panel, AlertQueue.tsx): All 20 alerts sorted by SLA urgency (closest to breach first, active before resolved). Severity-colored icons per alert type (13 types mapped). Tive-style status pills: Dark Red (#991B1B)=NEW, Amber (#DC2626)=ACK/INVESTIGATING, Orange=DISPATCHED, Green (#16A34A)=RESOLVED, Gray=CLOSED/FALSE ALARM. Customer badge, shipment ID, time-since-triggered. Real-time SLA countdown timers (setInterval, 10s tick) with breached state in red. Unread count badge. Click-to-select with blue highlight border. Resolved alerts dimmed.
  - **Center Map** (flex-grow): CartoDB dark tiles exclusively. On alert selection: map flies to incident location with pulsing red CSS-animated marker (keyframe scale+fade). Shipment route rendered as bright blue (#60A5FA) polylines (weight 3, opacity 0.65-0.7). Origin/destination A/B markers. Green vehicle marker shows shipment current position when >2km from alert trigger point. All other shipment blobs visible but dimmed. SOC-specific legend.
  - **Playbook & Dispatch Panel** (350px right panel, PlaybookPanel.tsx): TOP — SOC playbook steps loaded by alert type (getPlaybookByAlertType). Current step highlighted blue with full description, completed steps green checkmarks, future steps grayed. Step metadata: expected duration, escalation tier. MIDDLE — Recommended action box (yellow highlight) from alert.recommendedAction. Five action buttons: Acknowledge, Escalate, Contact Driver, Dispatch Field Unit, LE Liaison. BOTTOM — Field dispatch: 3 nearest simulated patrol units with distance/ETA, green DISPATCH button. After dispatch shows unit status with ETA countdown. Existing FieldResponse data shown when available (e.g., ALPHA-7 en route for alrt-001). Action log records all button clicks with timestamps.
  - **Field Response on Map**: Blue dot marker for active field response unit (from field-responses.json) with dashed blue ETA line connecting to incident. Permanent tooltip with callsign and ETA.
  - **Multi-Customer Badge Bar** (top bar): "BAT: 3 alerts | PharmaCo: 4 | TechElectronics: 0" calculated from active alerts. Red-highlighted for customers with active alerts.
  - **Shift Handover Modal** (ShiftHandoverModal.tsx): shadcn Dialog (z-index 10000+ to render above Leaflet). Four-column severity breakdown grid. Oldest unresolved alert. SLA-breached alert list. All open alerts summary. Handover notes textarea. Copy-to-clipboard button generating full text summary.
  - **Role Gating** (map/page.tsx): Conditional dynamic import — SOCConsole for soc_operator, MapConsole for all others. Both ssr:false.
  - **New files**: src/components/soc/SOCConsole.tsx, AlertQueue.tsx, PlaybookPanel.tsx, ShiftHandoverModal.tsx. src/components/ui/dialog.tsx (shadcn).
  - **Key architectural decisions**: SOCConsole reuses same OSRM + fallback route-rendering and Haversine position interpolation as MapConsole but with simplified logic (no breadcrumbs/deviations/geofences). Alert queue drives map state (not marker clicks). Playbook data comes from seed JSON matched by alert type.

## Important Reminders

- This is a PROTOTYPE with simulated data. No real API integrations.
- Every page must show an orange "PROTOTYPE — SIMULATED DATA" banner.
- All GPS data is simulated. The simulation engine animates pins along polylines.
- Use realistic European geography (Athens, Rotterdam, Sofia, Hamburg, etc.).
- The SOC console is the most important screen — it has no equivalent in any competitor.
