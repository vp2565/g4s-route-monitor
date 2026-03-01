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

## Important Reminders

- This is a PROTOTYPE with simulated data. No real API integrations.
- Every page must show an orange "PROTOTYPE — SIMULATED DATA" banner.
- All GPS data is simulated. The simulation engine animates pins along polylines.
- Use realistic European geography (Athens, Rotterdam, Sofia, Hamburg, etc.).
- The SOC console is the most important screen — it has no equivalent in any competitor.
