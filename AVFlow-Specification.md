# AVFlow Specification

# AVFlow — Production Implementation Specification

**Status:** Production-ready implementation specification  

**Product:** AVFlow  

**Audience:** Product engineering, backend, frontend, QA, DevOps, security, and design  

**Last revised:** 2026-05-04

## 0. Implementation Readiness Summary

This specification defines the production implementation plan for AVFlow, a professional AV/broadcast signal-flow documentation platform. It resolves the prior readiness gaps by defining MVP scope, release phases, system architecture, persistence decisions, role permissions, API behavior, data ownership, validation rules, UX states, security requirements, operational requirements, and acceptance criteria.

### Production implementation decision

Engineering may begin implementation from this specification using the phased delivery plan below.

### Non-negotiable implementation decisions

- **Primary database:** PostgreSQL 16.
- **Primary ID format:** ULID string for all application records.
- **Search index:** Meilisearch for gear catalog and project search.
- **File/object storage:** S3-compatible private buckets with signed read URLs.
- **Queue system:** BullMQ backed by Redis.
- **Realtime collaboration:** Not included in MVP. Implement single-user snapshot persistence first. Yjs realtime collaboration is Phase 4.
- **Canvas engine:** React Flow for Cable Diagram; custom SVG/HTML rendering for Rack Builder; Konva/react-konva for Studio Layout 2D.
- **3D Studio Layout:** Post-GA enhancement. Do not block MVP or beta on 3D.
- **Initial public sharing:** Viewer-only public links. Commenter role is reserved for Phase 4 and must not appear in MVP UI.
- **Starter plan:** Cable Diagram + Rack Builder + basic exports. Studio Layout and Job Sheets are Pro+.

---

## 1. Product Overview

AVFlow is a web application for AV/broadcast engineers to design, document, and export professional signal-flow systems.

The core experience is a node-based cable diagram editor where users place equipment, expose typed input/output ports, connect compatible ports with color-coded cables, assign cable run numbers, and generate documentation.

AVFlow provides three coordinated authoring views per project:

1. **Cable Diagram** — signal-flow canvas using React Flow.
2. **Rack Builder** — physical 19-inch rack elevation diagrams.
3. **Studio Layout** — top-down 2D floor plan for cameras, lighting, displays, furniture, audio, and production elements.

A shared equipment catalog underpins all views. Users may add official gear to projects, clone official gear into their workspace library, create custom gear, and optionally submit gear to a moderated community catalog.

AVFlow is a multi-tier SaaS product with authentication, subscriptions, projects, gear libraries, exports, sharing, team workspaces, version history, and later realtime collaboration.

---

## 2. Release Scope

### 2.1 MVP scope

MVP includes:

- Email/password authentication.
- 30-day Pro trial on signup.
- Single workspace per user at signup.
- Projects list with create, rename, archive, duplicate, delete.
- Gear catalog seed import.
- Gear search and filtering.
- Custom gear creation.
- Cable Diagram editor with single-user snapshot persistence.
- Gear nodes, zones, typed ports, signal-colored edges, cable run numbers.
- Basic Notes drawer.
- Basic CSV/PDF/PNG exports for Cable Diagram.
- Starter/Pro/Team/Business plan definitions.
- Stripe Checkout, customer portal, and webhook ingestion.
- Server-side entitlement enforcement.
- Audit logging for sensitive actions.
- Production observability, backups, and CI/CD.

### 2.2 Beta scope

Beta adds:

- Rack Builder.
- Job Sheet generation.
- Version History.
- Public viewer share links.
- Workspace team invitations.
- Pro/Team/Business entitlement gates.
- Full RBAC enforcement.
- Export job queue and signed export URLs.
- Accessibility and performance hardening.

### 2.3 GA scope

GA adds:

- Studio Layout 2D.
- Workspace branding.
- Community gear submission and moderation.
- Advanced settings for connectors/signals/job sheets.
- Project templates.
- Comprehensive public documentation and support workflows.

### 2.4 Phase 4 / post-GA scope

Post-GA adds:

- Realtime collaborative editing with Yjs for Team/Business.
- Commenter share role.
- Studio Layout 3D.
- Public API access for Business.
- Advanced analytics and usage dashboards.

---

## 3. Information Architecture and Routing

### 3.1 Marketing routes

- `/` — Landing page.
- `/#features` — Feature anchor.
- `/#pricing` — Pricing anchor.
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/billing/checkout`
- `/billing/success`

### 3.2 Authenticated app routes

- `/dashboard` — Projects list.
- `/dashboard/gear` — Gear Library.
- `/dashboard/job-sheets` — Job Sheets index. Pro+ only.
- `/dashboard/team` — Team management. Team/Business only.
- `/dashboard/settings` — Settings.
- `/dashboard/builder/:projectId` — Project editor shell.
- `/dashboard/builder/:projectId/cable`
- `/dashboard/builder/:projectId/rack`
- `/dashboard/builder/:projectId/studio`
- `/share/:token` — Public read-only project share.

### 3.3 Routing requirements

- Use Next.js App Router.
- All authenticated routes require a valid session.
- Unauthorized users redirect to `/login`.
- Authenticated users without workspace access receive a 403 screen.
- Plan-gated routes render an upgrade screen and do not load gated data.
- Backend must enforce the same permissions independently of frontend routing.

---

## 4. Technology Architecture

### 4.1 Frontend

- React 18.
- TypeScript strict mode.
- Next.js App Router.
- Tailwind CSS.
- TanStack Query for server state.
- Zustand for local editor UI state.
- React Flow for Cable Diagram.
- Konva/react-konva for Studio Layout 2D.
- Zod for client-side validation and shared schema validation.
- Playwright for E2E tests.
- Storybook for core component states.

### 4.2 Backend

- Node.js 20.
- TypeScript strict mode.
- Fastify or NestJS. Final choice must be made before scaffold; default recommendation is Fastify for API performance and schema-first validation.
- PostgreSQL 16 as source of truth.
- Prisma or Drizzle ORM. Final choice must be made before scaffold; default recommendation is Prisma for implementation speed.
- Redis for queues, rate limits, and ephemeral state.
- BullMQ for export, snapshot, email, and reindex jobs.
- S3-compatible object storage for exports, branding files, snapshots, and attachments.
- Meilisearch for gear catalog and project search.
- Stripe for billing.
- Postmark, SendGrid, or Resend for transactional email.
- OpenTelemetry + Sentry + structured logs.

### 4.3 Monorepo layout

```
apps/
  web/
  api/
  worker/
packages/
  types/
  ui/
  config/
  validators/
  api-client/
infra/
  docker/
  terraform/
  migrations/
```

### 4.4 Data ownership boundaries

- PostgreSQL is the source of truth for users, workspaces, memberships, projects, gear, canvas snapshots, settings, versions, job sheets, share tokens, subscriptions, audit logs, and export jobs.
- S3 stores large generated or uploaded objects. PostgreSQL stores metadata and object keys.
- Meilisearch is derived and rebuildable.
- Redis queue state is transient and rebuildable where possible.
- Realtime Yjs update storage is Phase 4 and must not be introduced into MVP persistence.

---

## 5. Identity, Authentication, and Sessions

### 5.1 Signup

On signup:

1. Create `User`.
2. Create default `Workspace`.
3. Create owner `Membership`.
4. Create trial subscription state with Pro entitlements for 30 days.
5. Create default user/workspace settings.
6. Send verification email.
7. Start authenticated session.

### 5.2 Login

- Email/password login.
- OAuth providers may be added after MVP; Google and Apple are planned.
- Password hash: Argon2id.
- Session cookie:
    - Name: `avf_session`.
    - httpOnly.
    - Secure in production.
    - SameSite=Lax.
    - 14-day rolling expiration.
- CSRF protection required for mutating browser-origin requests.

### 5.3 Password reset

- Reset token lifetime: 30 minutes.
- Tokens are single-use and stored hashed.
- Reset endpoint must return generic success to avoid account enumeration.

### 5.4 Email verification

- MVP may allow app access before verification.
- Billing, public sharing, and team invites require verified email.
- Verification token lifetime: 24 hours.

---

## 6. Roles and Permissions

### 6.1 Workspace roles

```tsx
export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";
```

### 6.2 Public share roles

MVP supports only:

```tsx
export type ShareRole = "viewer";
```

Reserved for Phase 4:

```tsx
export type FutureShareRole = "commenter" | "editor";
```

Do not expose Commenter or Editor public share roles before comment and share-editing systems are implemented.

### 6.3 Permission matrix

| Capability | Owner | Admin | Editor | Viewer | Public Viewer |
| --- | --- | --- | --- | --- | --- |
| View projects | Yes | Yes | Yes | Yes | Shared project only |
| Create projects | Yes | Yes | Yes | No | No |
| Edit project metadata | Yes | Yes | Yes | No | No |
| Edit canvas | Yes | Yes | Yes | No | No |
| Archive/delete projects | Yes | Yes | No | No | No |
| Duplicate projects | Yes | Yes | Yes | No | No |
| Create/edit custom gear | Yes | Yes | Yes | No | No |
| Submit community gear | Yes | Yes | Yes | No | No |
| Generate exports | Yes | Yes | Yes | Yes | No |
| Generate job sheets | Yes | Yes | Yes | No | No |
| View job sheets | Yes | Yes | Yes | Yes | If included in share |
| Restore versions | Yes | Yes | No | No | No |
| Create public share link | Yes | Yes | No | No | No |
| Revoke public share link | Yes | Yes | No | No | No |
| Manage members | Yes | Yes | No | No | No |
| Manage billing | Yes | No | No | No | No |
| Manage workspace settings | Yes | Yes | No | No | No |

### 6.4 Authorization requirements

- Every backend endpoint must enforce workspace membership and entitlement checks.
- Project access must be scoped by `workspaceId`.
- Public share tokens must never grant access outside their specific project.
- Object storage signed URLs must be generated only after authorization checks.
- Audit logs are required for:
    - Login failure rate-limit lockout.
    - Billing changes.
    - Membership changes.
    - Public share creation/revocation.
    - Project deletion.
    - Version restore.
    - Community gear approval/rejection.

---

## 7. Subscription, Trial, and Entitlements

### 7.1 Plans

```tsx
export type PlanCode = "starter" | "pro" | "team" | "business";

export interface Entitlements {
  projectQuota: number | "unlimited";
  customGearLimit: number | "unlimited";
  cableDiagram: boolean;
  rackBuilder: boolean;
  studioLayout: boolean;
  jobSheets: boolean;
  versionHistory: "none" | "last5" | "full";
  publicSharing: boolean;
  branding: boolean;
  exportFormats: ("png" | "pdf" | "csv" | "xlsx")[];
  teamSeats: number;
  collaborativeEditing: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}
```

### 7.2 Entitlement matrix

| Feature | Starter | Pro | Team | Business |
| --- | --- | --- | --- | --- |
| Project quota | 10 | Unlimited | Unlimited | Unlimited |
| Custom gear limit | 50 | Unlimited | Unlimited | Unlimited |
| Cable Diagram | Yes | Yes | Yes | Yes |
| Rack Builder | Yes | Yes | Yes | Yes |
| Studio Layout | No | Yes | Yes | Yes |
| Job Sheets | No | Yes | Yes | Yes |
| Version History | Last 5 | Full | Full | Full |
| Public sharing | Yes | Yes | Yes | Yes |
| Branding | No | Yes | Yes | Yes |
| Export formats | PNG, CSV, PDF | PNG, PDF, CSV, XLSX | PNG, PDF, CSV, XLSX | PNG, PDF, CSV, XLSX |
| Seats | 1 | 1 | 5 | 15 |
| Realtime collaboration | No | No | Phase 4 | Phase 4 |
| API access | No | No | No | Phase 4 |

### 7.3 Trial behavior

- Every new workspace receives Pro entitlements for 30 days.
- If no paid subscription exists at expiration, workspace downgrades to Starter.
- Existing Pro-only data is preserved.
- After downgrade:
    - Studio Layout and Job Sheets become read-only.
    - Users may export existing Pro content only if their current plan includes that export format.
    - Users cannot create or edit Pro-only content.
    - UI displays upgrade prompts on locked actions.
- Reminder emails: 7 days, 3 days, and 1 day before trial expiration.

### 7.4 Billing requirements

- Use Stripe Checkout for subscription purchase.
- Use Stripe Customer Portal for plan changes/cancellation.
- Webhooks must be idempotent using stored Stripe event IDs.
- Subscription status changes must update workspace entitlements within 60 seconds of webhook receipt.
- On webhook failure, retry with exponential backoff and alert after 5 consecutive failures.

---

## 8. Core Data Model

### 8.1 ID and timestamp standards

```tsx
export type ID = string;          // ULID
export type ISODateTime = string; // RFC3339 UTC
export type HexColor = `#${string}`;
```

All application tables include:

```tsx
createdAt: ISODateTime;
updatedAt: ISODateTime;
deletedAt?: ISODateTime | null;
```

Use soft deletion for user-facing resources unless legally required to hard-delete.

### 8.2 Primary entities

```tsx
export interface User {
  id: ID;
  email: string;
  emailVerifiedAt?: ISODateTime | null;
  name: string;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  passwordHash?: string | null;
  defaultWorkspaceId: ID;
  lastLoginAt?: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime | null;
}

export interface Workspace {
  id: ID;
  name: string;
  ownerId: ID;
  plan: PlanCode;
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | "incomplete";
  trialEndsAt?: ISODateTime | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  brandingLogoObjectKey?: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime | null;
}

export interface Membership {
  id: ID;
  workspaceId: ID;
  userId: ID;
  role: WorkspaceRole;
  invitedByUserId?: ID | null;
  joinedAt: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

### 8.3 Project model

```tsx
export interface Project {
  id: ID;
  workspaceId: ID;
  ownerId: ID;
  name: string;
  status: "active" | "archived";
  isDemo: boolean;
  clientName?: string | null;
  clientContact?: string | null;
  venueName?: string | null;
  venueTechContact?: string | null;
  venuePostcode?: string | null;
  eventDate?: ISODateTime | null;
  loadIn?: ISODateTime | null;
  loadOut?: ISODateTime | null;
  generalNotes?: string | null;
  gearCount: number;
  cableCount: number;
  lastModifiedByUserId?: ID | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime | null;
}
```

### 8.4 Gear model

```tsx
export type GearSource = "official" | "community" | "workspace";
export type GearModerationStatus = "none" | "pending" | "approved" | "rejected";

export interface Port {
  id: ID;
  label: string;
  connector: Connector;
  signal: Signal;
  direction: "in" | "out";
  position: number;
  maxConnections?: number | null; // null means use default by direction/signal
}

export interface Gear {
  id: ID;
  workspaceId?: ID | null; // null for official/community
  ownerUserId?: ID | null;
  source: GearSource;
  moderationStatus: GearModerationStatus;
  manufacturer: string;
  name: string;
  category: GearCategory;
  rackUnits?: number | null;
  background: HexColor;
  highlight: HexColor;
  inputs: Port[];
  outputs: Port[];
  specs?: Record<string, Record<string, string | number>>;
  aliases: string[];
  officialDataVersion?: string | null;
  communityApprovedAt?: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  deletedAt?: ISODateTime | null;
}
```

### 8.5 Gear catalog sourcing requirements

- The initial official catalog must be imported from an internally licensed seed dataset.
- Seed files must be stored in versioned import bundles.
- Each import must create an `ImportJob` audit record.
- Official gear updates must never mutate existing project nodes directly.
- When gear is added to a project, its display fields and port definitions are copied into the project node payload.
- Community gear must be moderated before becoming searchable outside the submitting workspace.
- Rejected community gear remains visible only to its submitting workspace if saved as custom workspace gear.

### 8.6 Canvas documents

```tsx
export type CanvasView = "cable" | "rack" | "studio";

export interface CanvasDoc {
  id: ID;
  projectId: ID;
  workspaceId: ID;
  view: CanvasView;
  schemaVersion: number;
  version: number; // optimistic concurrency integer
  payload: CableCanvasPayload | RackCanvasPayload | StudioCanvasPayload;
  updatedByUserId?: ID | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

### 8.7 Share tokens

```tsx
export interface ShareToken {
  id: ID;
  projectId: ID;
  workspaceId: ID;
  tokenHash: string;
  role: "viewer";
  includeJobSheets: boolean;
  includeNotes: boolean;
  expiresAt?: ISODateTime | null;
  revokedAt?: ISODateTime | null;
  createdByUserId: ID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

### 8.8 Export jobs

```tsx
export interface ExportJob {
  id: ID;
  workspaceId: ID;
  projectId: ID;
  requestedByUserId: ID;
  view: CanvasView | "jobSheet";
  format: "png" | "pdf" | "csv" | "xlsx";
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  objectKey?: string | null;
  signedUrlExpiresAt?: ISODateTime | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  attempts: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

### 8.9 Database indexes

Minimum required indexes:

```
users(email) unique where deleted_at is null
workspaces(owner_id)
memberships(workspace_id, user_id) unique
projects(workspace_id, status, updated_at desc)
projects(workspace_id, name)
gear(workspace_id, source, moderation_status)
gear(manufacturer, name)
canvas_docs(project_id, view) unique
share_tokens(project_id)
share_tokens(token_hash) unique
export_jobs(workspace_id, project_id, created_at desc)
audit_logs(workspace_id, created_at desc)
stripe_events(stripe_event_id) unique
```

---

## 9. Shared Type Foundations

```tsx
export type Currency = "GBP" | "USD" | "EUR" | "CAD" | "AUD" | "JPY";
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY";
export type MeasurementUnits = "metric" | "imperial";
export type RackUnits = number;
export type Meters = number;
export type Millimeters = number;
export type Pixels = number;

export const CONNECTORS = [
  "BNC", "Mini BNC", "HD-BNC", "HDMI", "Mini HDMI", "Micro HDMI",
  "DisplayPort", "Mini DP", "DVI", "VGA", "F-Type",
  "XLR 3-Pin", "XLR 4-Pin", "XLR 5-Pin", "Mini XLR",
  "1/4 TRS", "1/4 TS", "3.5mm TRS", "3.5mm TS", "RCA",
  "Speakon NL4", "Speakon NL8", "2-Pole Terminal", "4-Pole Terminal", "8-Pole Terminal",
  "TOSLINK", "DIN", "RJ45", "etherCON", "USB-A", "USB-B", "USB-C",
  "SFP/SFP+", "QSFP/QSFP+", "LC Fiber", "SC Fiber", "ST Fiber",
  "MPO/MTP", "opticalCON", "D-Sub 9", "D-Sub 15", "D-Sub 25",
  "Phoenix", "MIDI DIN", "Mini DIN 8-Pin", "Mini DIN 9-Pin",
  "Ground", "IEC", "powerCON", "Socapex", "NEMA 5-15", "Triax",
  "LEMO", "SMPTE Fiber", "Bare End", "Other"
] as const;

export type Connector = typeof CONNECTORS[number];

export const SIGNALS = [
  "SDI", "HDMI", "DisplayPort", "NDI", "HDBaseT", "XTP", "ST2110",
  "Composite", "Component", "S-Video", "DVI", "VGA",
  "AnalogAudio", "DigitalAudio", "Dante", "AES67", "MADI", "AES3",
  "Ethernet", "Fiber", "USB", "Control", "DMX", "Timecode", "WordClock",
  "RefSync", "Power", "Other"
] as const;

export type Signal = typeof SIGNALS[number];

export const DEFAULT_SIGNAL_COLORS: Record<Signal, HexColor> = {
  SDI: "#3B82F6",
  HDMI: "#EF4444",
  DisplayPort: "#EC4899",
  NDI: "#22C55E",
  HDBaseT: "#A855F7",
  XTP: "#6366F1",
  ST2110: "#0EA5E9",
  Composite: "#9CA3AF",
  Component: "#9CA3AF",
  "S-Video": "#9CA3AF",
  DVI: "#9CA3AF",
  VGA: "#9CA3AF",
  AnalogAudio: "#A855F7",
  DigitalAudio: "#7C3AED",
  Dante: "#16A34A",
  AES67: "#16A34A",
  MADI: "#FB923C",
  AES3: "#A855F7",
  Ethernet: "#10B981",
  Fiber: "#22D3EE",
  USB: "#06B6D4",
  Control: "#14B8A6",
  DMX: "#F59E0B",
  Timecode: "#F472B6",
  WordClock: "#94A3B8",
  RefSync: "#94A3B8",
  Power: "#F97316",
  Other: "#64748B",
};
```

---

## 10. Cable Diagram Specification

### 10.1 Canvas behavior

The Cable Diagram is the primary MVP editor.

Required interactions:

- Add gear from official, community, or workspace gear library.
- Create custom gear from inside the editor.
- Drag gear nodes on canvas.
- Select single or multiple nodes.
- Delete selected nodes/edges.
- Create zones.
- Move gear into/out of zones.
- Connect output ports to input ports.
- Display signal-colored edges.
- Display optional cable run number pill.
- Auto-assign cable run numbers.
- Edit cable label, length, notes, and label color.
- Undo/redo local edits.
- Save snapshot manually and by auto-save.
- Restore canvas from last saved version.
- Export Cable Diagram to PNG/PDF.
- Generate CSV cable schedule from valid edges.

### 10.2 Cable canvas payload

```tsx
export interface CableCanvasPayload {
  schemaVersion: 1;
  viewport: { x: number; y: number; zoom: number };
  nodes: CableNode[];
  edges: SignalEdge[];
  numbering: {
    strategy: "global" | "per-zone";
    nextGlobal: number;
    perZone: Record<ID, number>;
  };
}

export type CableNode =
  | GearNode
  | ZoneNode
  | CableLabelNode;

export interface GearNode {
  id: ID;
  type: "gearNode";
  position: { x: number; y: number };
  parentNode?: ID | null;
  extent?: "parent" | null;
  data: GearNodeData;
}

export interface GearNodeData {
  gearId: ID;
  gearSourceSnapshot: "official" | "community" | "workspace";
  label: string;
  manufacturer: string;
  modelName: string;
  category: GearCategory;
  rackUnits?: number | null;
  inputs: Port[];
  outputs: Port[];
  background: HexColor;
  highlight: HexColor;
  notes?: string | null;
  locked: boolean;
}

export interface ZoneNode {
  id: ID;
  type: "zoneNode";
  position: { x: number; y: number };
  width: number;
  height: number;
  data: {
    label: string;
    color: HexColor;
    collapsed: boolean;
    locked: boolean;
  };
}

export interface CableLabelNode {
  id: ID;
  type: "cableLabelNode";
  position: { x: number; y: number };
  data: {
    edgeId: ID;
    text: string;
  };
}

export interface SignalEdge {
  id: ID;
  type: "signalEdge";
  source: ID;
  sourceHandle: ID;
  target: ID;
  targetHandle: ID;
  data: {
    signal: Signal;
    connector: Connector;
    color: HexColor;
    runNumber?: string | null;
    lengthM?: number | null;
    labelColor?: HexColor | null;
    notes?: string | null;
    pathStyle: "bezier" | "step" | "straight";
    showLabelBubble: boolean;
    validationStatus: "valid" | "warning" | "invalid";
    validationMessages: string[];
  };
}
```

### 10.3 Connection validation policy

Validation has two levels:

- **Hard invalid:** Connection cannot be created or saved.
- **Warning:** Connection may be saved but appears in warnings and may be excluded from final job-sheet status until resolved.

Hard invalid cases:

- Source node does not exist.
- Target node does not exist.
- Source handle does not exist.
- Target handle does not exist.
- Source handle is not an output.
- Target handle is not an input.
- Connector is disabled in workspace settings.
- Signal is disabled in workspace settings.
- Source or target node is locked against editing.

Warning cases:

- Signal mismatch where either side uses `Other`.
- Connector mismatch where adapter behavior may be intended.
- Duplicate cable between same source and target ports.
- Missing cable length when job-sheet settings require lengths.
- Missing run number after manual numbering mode is enabled.

Port occupancy rules:

- Default input max connections: 1.
- Default output max connections: unlimited unless `maxConnections` is specified.
- Inputs with more than one connection are warning unless the port explicitly permits more.
- Patch panels, routers, DA/splitter gear, and multiviewers may define custom max connection behavior.

### 10.4 Cable numbering

- Default numbering strategy: global.
- Auto-number on edge creation.
- Run numbers are unique within a project for global strategy.
- Per-zone strategy prefixes or scopes numbers by zone.
- Manual renumber action is available from Cables menu.
- Renumbering must be deterministic by visual top-to-bottom, then left-to-right source node order, then edge creation time.

### 10.5 Cable Diagram acceptance criteria

- Given a user adds gear from the library, the node appears with denormalized gear label, manufacturer, model, inputs, outputs, colors, and rack units.
- Given compatible output/input ports, creating a connection produces a valid edge with signal, connector, color, and run number.
- Given a hard invalid connection, the edge is not created and the UI displays the reason.
- Given a warning connection, the edge is created with warning status and visible warning indicator.
- Given a saved canvas, reloading the project restores nodes, edges, viewport, zones, labels, and numbering exactly.
- Given two browser tabs edit the same canvas in MVP snapshot mode, the later save with stale version receives `409 conflict`.
- Given a conflict, the UI offers **Reload latest** and **Save as duplicate version**. MVP does not attempt automatic merge.
- Given a Cable Diagram export is requested, an export job is queued and completes with a signed URL.

---

## 11. Rack Builder Specification

### 11.1 Scope

Rack Builder is included in Starter and above. It is part of beta scope, not MVP.

### 11.2 Required behavior

- Create one or more racks per project.
- Configure rack name, total U, and width in millimeters.
- Front, rear, and split views.
- Drag gear into rack slots.
- Support gear face: front, rear, both.
- Prevent hard overlaps.
- Warn when item exceeds rack bounds.
- Export rack elevation to PDF/PNG.

### 11.3 Rack payload

```tsx
export interface RackCanvasPayload {
  schemaVersion: 1;
  viewport: { x: number; y: number; zoom: number };
  racks: Rack[];
}

export interface Rack {
  id: ID;
  name: string;
  totalU: number;
  widthMm: number;
  items: RackItem[];
}

export interface RackItem {
  id: ID;
  gearId: ID;
  sourceGearNodeId?: ID | null;
  customLabel?: string | null;
  slotU: number;
  uHeight: number;
  face: "front" | "rear" | "both";
  background?: HexColor | null;
}
```

### 11.4 Rack acceptance criteria

- Given a rack item is placed within available U space, the item renders at the correct U position.
- Given a rack item overlaps another item on the same face, placement is blocked.
- Given a rack item exceeds rack bounds, placement is blocked and a visible error is shown.
- Given split view is active, front and rear faces render with matching U numbering.
- Given a Rack export is requested, the generated PDF/PNG preserves U labels and physical proportions.

---

## 12. Studio Layout Specification

### 12.1 Scope

Studio Layout is Pro+ and GA scope. MVP and beta may show gated navigation only.

### 12.2 Required behavior

- Define room width, depth, and optional ceiling height.
- Place, move, rotate, resize, lock, group, and delete elements.
- Palette categories:
    - Cameras.
    - Lighting.
    - Displays.
    - Backdrops.
    - Rigging.
    - Furniture.
    - Audio.
    - Studio marks.
    - Architectural.
    - Custom.
- Maintain meter-based coordinates.
- Show dimension labels.
- Export to PDF/PNG.

### 12.3 Studio payload

```tsx
export type StudioElementKind =
  | "Camera" | "PTZCamera" | "JibCrane"
  | "Fresnel" | "LEDPanel" | "Softbox" | "RingLight" | "Practical"
  | "Display" | "Backdrop" | "Truss" | "Stand"
  | "Table" | "Chair" | "Sofa"
  | "Microphone" | "Speaker"
  | "FloorMark" | "TapeMark"
  | "Wall" | "Door" | "Window" | "Pillar"
  | "Custom";

export interface StudioCanvasPayload {
  schemaVersion: 1;
  room: {
    widthM: number;
    depthM: number;
    ceilingM?: number | null;
  };
  scalePxPerM: number;
  elements: StudioElement[];
}

export interface StudioElement {
  id: ID;
  kind: StudioElementKind;
  customAssetId?: ID | null;
  xM: number;
  yM: number;
  zM?: number | null;
  rotationDeg: number;
  widthM: number;
  depthM: number;
  heightM?: number | null;
  color?: HexColor | null;
  label?: string | null;
  zIndex: number;
  locked: boolean;
}
```

### 12.4 Studio acceptance criteria

- Given room dimensions are changed, existing element coordinates remain meter-based.
- Given an element is moved outside room bounds, the UI shows an out-of-bounds warning.
- Given a user without Studio entitlement opens Studio Layout, the UI shows an upgrade prompt and the backend rejects mutations with `402 upgrade_required`.
- Given a Studio export is requested, the output preserves scale, labels, and element rotation.

---

## 13. Notes, Vendors, Job Sheets, and Versions

### 13.1 Notes

Notes are project-level structured fields plus view-specific text notes.

```tsx
export interface ProjectNotes {
  projectId: ID;
  overviewNotes?: string | null;
  cableNotes?: string | null;
  rackNotes?: string | null;
  studioNotes?: string | null;
  clientName?: string | null;
  clientContact?: string | null;
  venueName?: string | null;
  venueTechContact?: string | null;
  venuePostcode?: string | null;
  eventDate?: ISODateTime | null;
  loadIn?: ISODateTime | null;
  loadOut?: ISODateTime | null;
}
```

### 13.2 Vendors

- Vendors are derived from gear manufacturers by default.
- Users may add manual vendor rows.
- Vendor rows are project-scoped.

```tsx
export interface Vendor {
  id: ID;
  projectId: ID;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  rate?: string | null;
  leadTime?: string | null;
  rfqStatus?: "not_started" | "requested" | "quoted" | "approved" | "rejected";
}
```

### 13.3 Job Sheets

Job Sheets are Pro+.

Generation rules:

- One cable schedule row per edge in the Cable Diagram.
- Invalid edges are excluded.
- Warning edges are included with warning notes.
- BOM aggregates gear by `manufacturer + modelName + gearId`.
- Generated job sheets are immutable snapshots.
- A regenerated job sheet creates a new version.

```tsx
export interface JobSheet {
  id: ID;
  projectId: ID;
  workspaceId: ID;
  status: "draft" | "sent" | "approved";
  generatedFromCanvasVersion: number;
  generatedAt: ISODateTime;
  rows: JobSheetRow[];
  bom: BomRow[];
}

export interface JobSheetRow {
  runNumber: string;
  fromGearId: ID;
  fromGearLabel: string;
  fromPortId: ID;
  fromPortLabel: string;
  toGearId: ID;
  toGearLabel: string;
  toPortId: ID;
  toPortLabel: string;
  signal: Signal;
  connector: Connector;
  lengthM?: number | null;
  labelColor?: HexColor | null;
  notes?: string | null;
  validationStatus: "valid" | "warning";
}
```

### 13.4 Version History

- Create automatic version snapshot after every successful manual save.
- Auto-save updates canvas snapshot but does not create visible version history entry every time.
- Manual save may include an optional version message.
- Starter retains last 5 versions.
- Pro/Team/Business retain full version history.
- Restore creates a new version rather than deleting history.

### 13.5 Acceptance criteria

- Given valid cable edges exist, generating a job sheet creates one row per valid edge.
- Given warning edges exist, generated rows include warning status and notes.
- Given gear appears multiple times, BOM quantity equals count of project nodes by gear model snapshot.
- Given a version is restored, the current canvas becomes the restored payload and a new version entry records the restore action.
- Given Starter exceeds 5 versions, the oldest non-pinned visible versions are pruned from version history display while internal audit logs remain.

---

## 14. Projects

### 14.1 Project list behavior

Columns:

- Name.
- Client/Venue.
- Event date.
- Gear count.
- Cable count.
- Modified.
- Status.
- Owner.

Filters:

- Active.
- Archived.
- Search.
- Sort by last modified, name A-Z, name Z-A, event date.

### 14.2 Project lifecycle

- Create project creates three empty canvas docs: cable, rack, studio.
- Archive hides project from Active list but preserves data.
- Delete soft-deletes project and associated user-facing records.
- Duplicate creates:
    - Project metadata.
    - Canvas docs.
    - Notes.
    - Vendors.
    - Custom project settings.
- Duplicate does not copy:
    - Share tokens.
    - Export jobs.
    - Audit logs.
    - Job sheet immutable snapshots unless user selects “include job sheets.”

### 14.3 Project acceptance criteria

- Given a user creates a project under quota, it appears in Active with empty canvas docs.
- Given a user is over quota, project creation returns `402 upgrade_required`.
- Given a project is archived, it appears only in Archived unless filters include all statuses.
- Given a project is deleted, it is no longer visible by default and cannot be opened.
- Given a project is duplicated, the duplicate has independent canvas versions and no share tokens.

---

## 15. Gear Library and Custom Gear

### 15.1 Library behavior

Tabs:

- Official Library.
- Community Library.
- My Library.

Filters:

- Category.
- Manufacturer.
- Inputs.
- Outputs.
- Signal.
- Connector.
- Rack units.

Search fields:

- Manufacturer.
- Model name.
- Aliases.
- Port labels.
- Specs.

### 15.2 Custom gear validation

Required fields:

- Manufacturer.
- Name.
- Category.
- Background color.
- Highlight color.
- At least one input or output unless category is Blank Panel or Accessory.

Port validation:

- Label required.
- Connector required.
- Signal required.
- Direction required.
- Position auto-assigned but persisted.
- Duplicate labels allowed only if positions differ; UI warns.

### 15.3 Community submission

- Submission creates a moderation record.
- Pending community gear is visible to submitter as workspace gear.
- Admin moderation actions:
    - Approve.
    - Reject with reason.
    - Request changes.
- Approved gear becomes searchable in Community Library.
- Official catalog remains separate from Community Library.

### 15.4 Gear acceptance criteria

- Given search query matches manufacturer/model/alias, matching gear appears in ranked order.
- Given filters are combined, results satisfy all selected filters.
- Given custom gear is saved, it appears in My Library and can be added to a project.
- Given custom gear is added to a project, project node uses a snapshot of ports at time of add.
- Given community gear is submitted, it remains pending until moderation.

---

## 16. Settings

### 16.1 User settings

```tsx
export interface UserSettings {
  userId: ID;
  measurementUnits: "metric" | "imperial";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY";
  defaultCurrency: Currency;
  autoSaveIntervalSec: 15 | 30 | 60 | 120;
}
```

### 16.2 Workspace settings

```tsx
export interface WorkspaceSettings {
  cableDiagram: {
    snapToGrid: boolean;
    showAlignmentGuides: boolean;
    showCableLabels: boolean;
    showCableNumbers: boolean;
    showCableCrossingHops: boolean;
    simpleMode: boolean;
    trackpadMode: boolean;
    gridSizePx: number;
  };
  studioLayout: {
    snapToGrid: boolean;
    pxPerMeter: number;
    defaultRoom: { widthM: number; depthM: number };
    show3D: boolean;
  };
  patchPanel: {
    rows: number;
    portsPerRow: number;
    labelFormat: "numeric" | "alphanumeric";
  };
  cables: {
    enabledConnectors: Connector[];
    enabledSignals: Signal[];
    signalColors: Partial<Record<Signal, HexColor>>;
    defaultLengthM: number;
  };
  jobSheets: {
    columns: JobSheetColumn[];
    coverPageEnabled: boolean;
  };
}
```

### 16.3 Settings acceptance criteria

- Given a connector is disabled, new cable connections using it are blocked.
- Given a signal color is changed, new edges use the updated color and existing edges retain their stored color unless user selects “apply to existing.”
- Given auto-save interval changes, editor uses new interval without requiring logout.
- Given branding is not entitled, upload controls are disabled and backend rejects branding mutation.

---

## 17. API Contract

### 17.1 API standards

Base URL:

```
https://avflow.app/api
```

Authentication:

- Cookie session `avf_session`.
- CSRF token for mutating browser requests.
- Webhooks use provider signatures, not session auth.

Standard success envelope:

```tsx
export interface ApiSuccess<T> {
  data: T;
  requestId: string;
}
```

Standard error envelope:

```tsx
export interface ApiError {
  error: {
    code:
      | "validation_error"
      | "unauthenticated"
      | "forbidden"
      | "upgrade_required"
      | "not_found"
      | "conflict"
      | "rate_limited"
      | "internal_error";
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
}
```

Pagination envelope:

```tsx
export interface Paginated<T> {
  items: T[];
  nextCursor?: string | null;
  hasMore: boolean;
}
```

### 17.2 Required endpoints

#### Auth

```
POST /auth/signup
POST /auth/login
POST /auth/logout
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/verify-email
GET  /me
```

#### Projects

```
GET    /projects
POST   /projects
GET    /projects/:projectId
PATCH  /projects/:projectId
DELETE /projects/:projectId
POST   /projects/:projectId/archive
POST   /projects/:projectId/unarchive
POST   /projects/:projectId/duplicate
```

#### Canvas

```
GET   /projects/:projectId/canvas/:view
PUT   /projects/:projectId/canvas/:view
POST  /projects/:projectId/canvas/:view/validate
POST  /projects/:projectId/cables/renumber
```

Canvas save uses optimistic concurrency:

```
PUT /projects/:projectId/canvas/cable
If-Match: "42"
```

Conflict response:

```json
{
  "error": {
    "code": "conflict",
    "message": "Canvas version conflict.",
    "details": {
      "currentVersion": 43
    }
  },
  "requestId": "req_..."
}
```

#### Gear

```
GET    /gear
POST   /gear
GET    /gear/:gearId
PATCH  /gear/:gearId
DELETE /gear/:gearId
POST   /gear/:gearId/add-to-library
POST   /gear/:gearId/submit-community
GET    /gear/facets
GET    /enums/connectors
GET    /enums/signals
```

#### Notes, vendors, job sheets

```
GET   /projects/:projectId/notes
PATCH /projects/:projectId/notes
GET   /projects/:projectId/vendors
POST  /projects/:projectId/vendors
PATCH /projects/:projectId/vendors/:vendorId
DELETE /projects/:projectId/vendors/:vendorId
GET   /projects/:projectId/job-sheets
POST  /projects/:projectId/job-sheets
GET   /job-sheets/:jobSheetId
PATCH /job-sheets/:jobSheetId/status
```

#### Versions

```
GET  /projects/:projectId/versions
POST /projects/:projectId/versions
POST /projects/:projectId/versions/:versionId/restore
```

#### Sharing

```
GET    /projects/:projectId/share-tokens
POST   /projects/:projectId/share-tokens
DELETE /projects/:projectId/share-tokens/:shareTokenId
GET    /share/:token
```

#### Exports

```
POST /exports
GET  /exports/:exportJobId
POST /exports/:exportJobId/cancel
```

#### Billing

```
GET  /plans
POST /billing/checkout-session
POST /billing/portal-session
POST /billing/webhook
```

#### Team

```
GET    /workspace/members
POST   /workspace/invitations
PATCH  /workspace/members/:memberId
DELETE /workspace/members/:memberId
POST   /invitations/:token/accept
```

### 17.3 API acceptance criteria

- All endpoints return `ApiSuccess<T>` or `ApiError`.
- All list endpoints use cursor pagination.
- All mutating endpoints validate input with shared schemas.
- All project-scoped endpoints enforce workspace access.
- All gated endpoints enforce entitlement server-side.
- Canvas save returns new version number after success.
- Stale canvas save returns `409 conflict`.
- Public share endpoint returns only fields allowed by share token flags.

---

## 18. Export Specifications

### 18.1 Export formats

Cable Diagram:

- PNG.
- PDF.
- CSV cable schedule.

Rack Builder:

- PNG.
- PDF.

Studio Layout:

- PNG.
- PDF.

Job Sheets:

- PDF.
- CSV.
- XLSX.

### 18.2 Export requirements

- Exports are asynchronous jobs.
- Jobs expire signed URLs after 24 hours.
- Completed export object remains stored for 30 days unless manually deleted.
- Failed jobs store error code and message.
- Workers retry failed jobs up to 3 times.
- Export filenames:
    - `AVFlow-{projectName}-{view}-{YYYYMMDD}.{ext}`
- PDF defaults:
    - US Letter landscape for Cable Diagram.
    - A3 landscape if diagram bounds exceed Letter aspect ratio.
    - Include project name, export timestamp, and page number.
- PNG defaults:
    - 2x pixel density.
    - Transparent background disabled unless user selects it.
- CSV encoding:
    - UTF-8.
    - Header row required.

### 18.3 Export acceptance criteria

- Given an export is requested, API returns `202` and job ID.
- Given export succeeds, polling returns signed URL.
- Given export fails after retries, UI displays failure reason and retry option.
- Given project name has invalid filename characters, export filename is sanitized.
- Given a viewer requests export, backend allows only if viewer is workspace member, not public share viewer.

---

## 19. UX States and Error Handling

### 19.1 Global states

Every major screen must define:

- Loading state.
- Empty state.
- Error state.
- Permission-denied state.
- Upgrade-required state.
- Offline state where relevant.

### 19.2 Projects page states

- Empty: “Create your first AVFlow project.”
- No search results: “No projects match your search.”
- Quota exceeded: upgrade prompt and project creation disabled.
- Archived empty: “No archived projects.”

### 19.3 Gear page states

- Empty My Library: “Create custom gear or add gear from the library.”
- No results: show clear filters button.
- Import/index unavailable: show retry message.

### 19.4 Editor states

- Loading canvas.
- Saving.
- Saved.
- Save failed.
- Offline changes pending.
- Version conflict.
- Read-only due to role.
- Read-only due to plan downgrade.
- Export queued.
- Export failed.
- Validation warnings.

### 19.5 Billing states

- Trial active.
- Trial expiring.
- Trial expired.
- Payment failed.
- Subscription active.
- Subscription canceled at period end.

### 19.6 Error handling requirements

- API validation errors must map fields to UI errors.
- Rate limit errors show retry-after time.
- Permission errors do not reveal existence of inaccessible resources.
- Public share expired/revoked links show generic unavailable page.
- Canvas corrupt payload must show recovery screen with option to load latest valid version.

---

## 20. Security, Privacy, and Compliance

### 20.1 Security requirements

- Tenant isolation by `workspaceId`.
- Server-side RBAC on every protected endpoint.
- CSRF on browser mutating requests.
- Argon2id password hashing.
- Password minimum length: 10 characters.
- Account lockout after repeated failed login attempts.
- Rate limits:
    - Auth: 10 attempts per IP/email per 10 minutes.
    - Exports: 20 per workspace per hour by default.
    - Gear creation: 100 per workspace per day by default.
- Signed S3 URLs expire after 24 hours for exports and 10 minutes for uploads.
- File uploads must validate MIME type and extension.
- Branding uploads max size: 5 MB.
- Malware scanning required before GA for user-uploaded files.
- Secrets stored in managed secret store.
- Logs must redact emails, tokens, cookies, and Stripe secrets.

### 20.2 Privacy requirements

- Store only required user PII: name, email, avatar URL, job title.
- Public share pages must not expose user emails.
- Audit logs may store user IDs but not session cookies or tokens.
- Support GDPR-style export/delete workflows before GA.
- Deleted user personal data must be anonymized after legal retention window.

### 20.3 Compliance requirements

- Maintain audit logs for 1 year minimum.
- Maintain export files for 30 days by default.
- Maintain soft-deleted projects for 30 days before hard purge unless legal hold applies.
- Backups encrypted at rest.
- TLS required for all production traffic.

---

## 21. Observability and Operations

### 21.1 Environments

- Local.
- Development.
- Staging.
- Production.

### 21.2 CI/CD

- Required checks:
    - TypeScript.
    - Lint.
    - Unit tests.
    - API contract tests.
    - Build.
    - Database migration dry run.
    - Playwright smoke tests.
- Production deploy requires staging pass and manual approval until GA.

### 21.3 Backups and disaster recovery

- PostgreSQL point-in-time recovery enabled.
- Daily full backups.
- Backup retention: 30 days.
- RPO: 15 minutes.
- RTO: 4 hours for MVP/beta, 1 hour target for GA.
- Quarterly restore test required after GA.

### 21.4 Monitoring

Track:

- API latency p50/p95/p99.
- API error rate.
- Auth failures.
- Canvas save failures.
- Export queue depth.
- Export failure rate.
- Stripe webhook failures.
- Worker job retries.
- Database CPU/storage/connections.
- Web vitals.
- Frontend error rate.

### 21.5 Alerts

Alert when:

- API 5xx rate > 2% for 5 minutes.
- Stripe webhook failures > 5 consecutive.
- Export queue oldest job > 10 minutes.
- Canvas save failure rate > 5% for 10 minutes.
- Database storage > 80%.
- Sentry issue spike exceeds baseline.

---

## 22. Testing Strategy

### 22.1 Unit tests

Required for:

- Entitlement resolver.
- RBAC policy.
- Signal/connector validator.
- Rack overlap validator.
- Cable renumbering.
- Job sheet generation.
- Export filename sanitizer.
- Stripe webhook idempotency.
- Settings validation.
- Gear import validation.

### 22.2 Integration tests

Required for:

- Signup and trial creation.
- Login/logout.
- Project CRUD.
- Canvas save/load/conflict.
- Gear create/search/filter.
- Billing checkout session creation.
- Stripe webhook processing.
- Export job lifecycle.
- Public share token access.
- Team invitation lifecycle.

### 22.3 E2E tests

Required Playwright flows:

1. Signup → create project → add gear → connect cable → save → reload.
2. Create custom gear → add to project.
3. Generate cable CSV export.
4. Archive and unarchive project.
5. Upgrade-required flow for Studio on Starter.
6. Create and revoke share link.
7. Team invite accept flow.
8. Job sheet generation on Pro.
9. Canvas conflict handling.
10. Viewer read-only access.

### 22.4 Performance tests

Minimum targets:

- Projects list loads under 1.5 seconds for 1,000 projects.
- Gear search returns under 500 ms for 10,000 gear items.
- Cable canvas with 500 nodes and 1,000 edges remains interactive above 30 FPS on target hardware.
- Canvas save payload under 2 MB for 500-node diagrams.
- Export job for 500-node diagram completes under 60 seconds.

### 22.5 Accessibility tests

- WCAG 2.2 AA for non-canvas UI.
- Keyboard navigation for menus, drawers, dialogs, forms, tables.
- Focus trapping in modals.
- Visible focus states.
- Canvas must support keyboard selection, delete, zoom, fit view, and open properties panel.
- All icon-only buttons require accessible labels.

---

## 23. Implementation Milestones

### Milestone 1 — Foundation

Deliverables:

- Monorepo.
- Database schema and migrations.
- Auth/session.
- Workspace/membership.
- Entitlement resolver.
- Stripe plan config.
- CI/CD.
- Logging and request IDs.

Exit criteria:

- User can sign up, log in, and see empty dashboard.
- Trial workspace is created.
- `/me` returns user, workspace, role, and entitlements.
- Unit and integration tests pass.

### Milestone 2 — Gear and Projects

Deliverables:

- Gear catalog import.
- Gear search/filter.
- Custom gear.
- Project CRUD.
- Project quota enforcement.

Exit criteria:

- User can create project under quota.
- User can search gear and create custom gear.
- Gear appears in My Library.
- Project archive/duplicate/delete behavior works.

### Milestone 3 — Cable Diagram MVP

Deliverables:

- React Flow editor.
- Add gear node.
- Connect ports.
- Validation.
- Save/load snapshot.
- Auto-save.
- Cable numbering.
- Basic notes.
- PNG/PDF/CSV export.

Exit criteria:

- User can create, save, reload, and export a cable diagram.
- Conflict handling works.
- 500-node performance test passes baseline.

### Milestone 4 — Billing and Sharing

Deliverables:

- Stripe Checkout.
- Stripe Portal.
- Webhooks.
- Public viewer share links.
- Plan-gated UI and backend checks.

Exit criteria:

- Subscription changes update entitlements.
- Share links can be created/revoked.
- Public share exposes only allowed read-only data.

### Milestone 5 — Beta Features

Deliverables:

- Rack Builder.
- Job Sheets.
- Version History.
- Team invitations.
- Full RBAC matrix.

Exit criteria:

- Pro user can generate job sheet.
- Starter user cannot access job sheets.
- Team invite and role enforcement work.
- Rack export works.

### Milestone 6 — GA Features

Deliverables:

- Studio Layout 2D.
- Branding.
- Community gear moderation.
- Advanced settings.
- Security/privacy hardening.
- Backup/restore test.
- Accessibility audit.

Exit criteria:

- GA acceptance suite passes.
- Security review complete.
- Observability dashboards live.
- Incident runbooks complete.

### Milestone 7 — Phase 4 Realtime

Deliverables:

- Yjs collaboration for Team/Business.
- WebSocket gateway.
- Yjs update persistence.
- Presence.
- Offline/reconnect sync.
- Commenter role.

Exit criteria:

- Two editors can collaborate without data loss.
- Invalid CRDT state is corrected server-side.
- Reconnect tests pass.
- Realtime feature flag can be disabled safely.

---

## 24. Realtime Collaboration Design — Phase 4

Realtime collaboration must not be implemented until single-user canvas persistence is stable.

### 24.1 Realtime architecture

- Yjs document per `projectId + view`.
- WebSocket gateway authenticates session and checks project edit permission.
- Awareness state includes cursor, selection, display name, and color.
- Yjs updates persisted to `canvas_yjs_updates`.
- Snapshot worker squashes Yjs document into `canvas_docs` for cold loads and exports.

### 24.2 Phase 4 acceptance criteria

- Given two editors in a Team workspace edit the same canvas, updates converge within 1 second under normal network conditions.
- Given one editor goes offline, edits sync after reconnect without losing remote changes.
- Given invalid edge state is introduced, server emits compensating update and all clients converge.
- Given realtime feature flag is disabled, editor falls back to snapshot mode.

---

## 25. Acceptance Criteria Summary

Production readiness requires all applicable criteria below.

### Auth

- Signup creates user, workspace, membership, settings, and trial.
- Login creates secure session.
- Logout clears session.
- Password reset tokens are single-use and expire.

### Projects

- Create, edit, archive, unarchive, duplicate, and delete work according to role and quota.
- Project list filtering and sorting are correct.
- Deleted projects are inaccessible.

### Gear

- Gear search and filters work together.
- Custom gear validates required fields.
- Project nodes snapshot gear data.

### Cable Diagram

- Compatible connections create valid edges.
- Invalid connections are blocked.
- Warning connections are marked.
- Save/load preserves full canvas state.
- Conflict handling works.
- Export jobs complete.

### Rack Builder

- Rack bounds and overlap validation work.
- Rack export preserves U layout.

### Studio Layout

- Pro+ gate enforced.
- Coordinates and room dimensions are meter-based.
- Export preserves scale.

### Job Sheets

- Generated from current saved cable canvas.
- Immutable after generation.
- Invalid edges excluded.
- Warning edges included with warning status.

### Billing

- Trial starts on signup.
- Stripe webhooks are idempotent.
- Downgrade preserves data but gates edits.

### Sharing

- Viewer links are read-only.
- Revoked/expired links stop working.
- Public share does not expose private workspace data.

### Security

- RBAC enforced server-side.
- Tenant isolation tested.
- Signed URLs expire.
- Audit logs record sensitive actions.

### Operations

- Backups enabled.
- Monitoring dashboards exist.
- Alerts configured.
- CI/CD gates production deploy.

---

## 26. Final Build Checklist

1. Scaffold monorepo and infrastructure.
2. Implement database schema and migrations.
3. Implement auth, sessions, CSRF, and `/me`.
4. Implement workspace, membership, roles, and entitlement resolver.
5. Implement Stripe plans, checkout, portal, and webhook idempotency.
6. Implement gear catalog import, search, filters, and custom gear.
7. Implement project CRUD, archive, duplicate, delete, and quota enforcement.
8. Implement Cable Diagram MVP with snapshot save/load.
9. Implement cable validation, numbering, notes, and exports.
10. Implement frontend UX states and error handling.
11. Implement audit logs and security controls.
12. Implement Rack Builder.
13. Implement Job Sheets and Version History.
14. Implement public viewer sharing.
15. Implement Team invitations and full RBAC.
16. Implement Studio Layout 2D.
17. Implement community gear moderation.
18. Complete accessibility, performance, security, and disaster recovery testing.
19. Launch beta.
20. Resolve beta findings.
21. Launch GA.
22. Implement realtime collaboration after GA stabilization.

---

## 27. Definition of Done

A feature is complete only when:

- Product behavior matches this specification.
- Backend authorization and entitlement checks are implemented.
- API contract is documented and tested.
- Frontend loading, empty, error, permission, and upgrade states are implemented.
- Unit tests cover core logic.
- Integration tests cover API behavior.
- E2E tests cover user-critical flows.
- Audit logging exists for sensitive actions.
- Observability emits useful logs, metrics, and errors.
- Documentation is updated.
- Security implications are reviewed.
- Acceptance criteria pass in staging.

---

*End of production implementation specification.*