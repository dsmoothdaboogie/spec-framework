# Generic Primitives & Persona-Driven Dashboard — Design

> Refactor the demo app to use generic DS-portable primitives, add persona-driven
> dashboards, and prove the spec-driven AI coding loop end-to-end.

## Problem

The demo app has 7 deal-specific cell renderers with hardcoded business logic
and no dashboard layer. This makes it impossible to:

1. Port renderers to a real DS library (too coupled to deal domain)
2. Test the spec-driven workflow for non-grid patterns
3. Demonstrate persona-driven UI beyond column differences in a grid

## Goals

1. **Generic primitives** — reusable renderers portable to `@company/ds/ag-grid`
2. **Thin deal wrappers** — keep business logic separate, delegate rendering to generics
3. **Dashboard pattern** — spec-driven, persona-configured widget layouts
4. **Prove the loop** — agent generates deal-origination-banker grid + dashboard from specs

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Renderer strategy | Generic + thin wrappers (B) | Wrappers absorb business logic; generics are DS-portable |
| Dashboard config | Composition specs per persona | Same pattern as grid compositions — proven model |
| What specs control | Data, layout, labels, format, entitlements | Not colors/styling — that's DS tokens |
| Navigation | Signal-based sub-nav (Dashboard / Grid) | No Angular router — matches existing app pattern |
| Agent test | Deal-origination-banker grid + dashboard | Agent generates from spec, compliance checker validates |

## Architecture

### Layer Model

```
┌────────────────────────────────────────────────────────┐
│  Composition Specs (per persona)                       │
│  domain/patterns/dashboard/coverage-banker.spec.md     │
│  domain/patterns/ag-grid-datatable/coverage-banker...  │
├────────────────────────────────────────────────────────┤
│  Base Pattern Specs                                    │
│  ds/patterns/dashboard.spec.md                         │
│  ds/patterns/ag-grid-datatable.spec.md                 │
│  ds/templates/deal-pipeline-page.spec.md               │
├────────────────────────────────────────────────────────┤
│  Feature Components (persona-specific)                 │
│  features/{persona}/dashboard/                         │
│  features/{persona}/deal-grid/                         │
├────────────────────────────────────────────────────────┤
│  Deal Wrappers (business logic)                        │
│  shared/cell-renderers/deal-stage-renderer/            │
│  shared/cell-renderers/deal-size-renderer/  ...        │
├────────────────────────────────────────────────────────┤
│  Generic Primitives (DS-portable)                      │
│  shared/primitives/status-badge/                       │
│  shared/widgets/metric-card/  ...                      │
├────────────────────────────────────────────────────────┤
│  DS Tokens + Components                                │
│  Semantic tokens, badge variants, typography            │
└────────────────────────────────────────────────────────┘
```

### Grid Component → Wrapper → Generic Primitive Flow

```
CoverageBankerGridComponent
  columnDefs: [{ cellRenderer: DealStageRendererComponent }]
                        │
                        ▼
DealStageRendererComponent (wrapper)
  - Maps DealStage value → badge variant (business logic)
  - Delegates to StatusBadgeRendererComponent
                        │
                        ▼
StatusBadgeRendererComponent (generic primitive)
  - Inputs: value, variant
  - Renders a badge using DS tokens
  - Knows nothing about deals
```

### Dashboard Persona Composition Flow

```
Composition Spec (domain/patterns/dashboard/coverage-banker.spec.md)
  "slot metrics-1: metricCard, metric: totalPipelineValue, label: Pipeline Value, format: currency"
                        │
                        ▼
Agent reads spec → generates CoverageBankerDashboardComponent
  widgets = [
    { type: 'metricCard', slot: 'metrics-1', params: { metric: 'totalPipelineValue', ... } },
    ...
  ]
                        │
                        ▼
MetricCardComponent (generic widget)
  - Inputs: label, value, format, trend, clickRoute
  - Renders using DS card + DS tokens
  - Knows nothing about banking
```

## Generic Primitives (4 cell renderers)

### StatusBadgeRendererComponent

Renders a badge with a variant. The variant is passed as a param — the
component doesn't decide what color to use for a given value.

```typescript
// Inputs
value = input.required<string>();
variant = input<string>('neutral'); // success | warning | error | info | neutral
```

Deal wrappers use it like:
```typescript
// DealStageRendererComponent (wrapper)
const STAGE_VARIANT: Record<DealStage, string> = {
  Origination: 'info', Mandate: 'info', 'Due Diligence': 'warning',
  Marketing: 'warning', Pricing: 'success', Closed: 'neutral', Withdrawn: 'error',
};

// In template: <app-status-badge [value]="stage" [variant]="stageVariant" />
```

### ActionIconRendererComponent

Renders one or more icon buttons in a cell. Actions are passed as params.

```typescript
// Inputs
actions = input<ActionDef[]>([]);
// ActionDef: { type: string, icon: string, tooltip: string, disabled?: boolean }
// Output
actionClicked = output<{ type: string, rowData: any }>();
```

### LinkRendererComponent

Renders cell value as a clickable link.

```typescript
// Inputs
value = input.required<string>();
route = input<string>(); // route template with {field} placeholders
external = input(false);
```

### DefaultTextRendererComponent

Text with optional truncation and copy-to-clipboard.

```typescript
// Inputs
value = input.required<string>();
maxLength = input<number>();
copyable = input(false);
```

## Cell Renderer Refactor (7 wrappers)

Each existing renderer becomes a thin wrapper. The wrapper:
1. Implements `ICellRendererAngularComp` (unchanged API for grids)
2. Contains the business logic (value → variant mapping, threshold calculations)
3. Delegates to a generic primitive for rendering

| Wrapper | Generic it uses | Business logic it keeps |
|---|---|---|
| DealStageRenderer | StatusBadge | Stage → variant map |
| ConflictStatusRenderer | StatusBadge | ConflictStatus → variant map |
| CoverageMultipleRenderer | StatusBadge | Numeric threshold → variant |
| DealSizeRenderer | DefaultText | formatDealSize() + dealSizeCategory() |
| FeeRevenueRenderer | DefaultText | formatBps() + calcGrossRevenue() |
| DaysCountdownRenderer | StatusBadge | Days threshold → variant |
| MilestoneProgressRenderer | DefaultText | Percentage formatting |

## Dashboard Widgets (5 components)

### MetricCardComponent

```typescript
label = input.required<string>();
value = input.required<number | string>();
format = input<'number' | 'currency' | 'percent'>('number');
trend = input<'up' | 'down' | 'flat'>();
clickRoute = input<string>();
```

Renders a card with the formatted value, label, optional trend indicator, and
optional click-to-navigate behavior.

### MiniGridComponent

```typescript
columnDefs = input.required<ColDef[]>();
rowData = input.required<any[]>();
maxRows = input(5);
title = input<string>();
viewAllRoute = input<string>();
```

Compact AG Grid with limited rows and a "View all" link.

### StatusDistributionComponent

```typescript
segments = input.required<{ label: string; count: number; variant: string }[]>();
title = input<string>();
```

Horizontal segmented bar showing distribution counts. Each segment uses DS
badge variant for color.

### ActivityFeedComponent

```typescript
items = input.required<{ timestamp: Date; description: string; actor?: string }[]>();
maxItems = input(10);
title = input<string>();
```

Chronological list of events.

### AlertListComponent

```typescript
items = input.required<{ severity: string; title: string; description: string; action?: string }[]>();
maxItems = input(5);
title = input<string>();
```

Prioritized list of items needing attention. Severity maps to DS badge variant
internally.

## New Specs

### ds/patterns/dashboard.spec.md

Base pattern spec defining:
- Widget type registry (5 types with param contracts)
- Layout system (rows and columns, responsive behavior)
- Widget state management (loading, empty, error per widget)
- Refresh behavior
- Accessibility requirements

### ds/templates/deal-pipeline-page.spec.md

Page template spec defining:
- Page shell: persona header + sub-navigation (Dashboard | Grid)
- Dashboard → Grid navigation (click metric → filtered grid)
- Page-level loading and error states

### domain/patterns/dashboard/{persona}.spec.md (6 specs)

Composition specs, one per persona:
- Widget layout table (which widgets in which slots)
- Widget params per slot (metric, label, format, etc.)
- Entitlement-based widget visibility
- Persona-specific data filters

## Demo App Changes

### Navigation

App shell adds sub-navigation per persona tab:
- Default view: Dashboard
- "View all" or metric click: switches to Grid view
- Signal-based: `activePersona` + `activeView` (dashboard | grid)

### State

DealStore gets computed signals for dashboard metrics:
```typescript
// Computed from existing deals data
totalPipelineValue = computed(() => /* sum of dealSizeUsd where active */);
activeDeals = computed(() => /* count where status != Closed/Withdrawn */);
dealsByStage = computed(() => /* group by stage, count each */);
recentActivity = computed(() => /* last N events from audit data */);
pendingConflicts = computed(() => /* count where conflictStatus == Pending */);
// ... per persona
```

### Mock Data

Extend existing mock data with:
- Activity feed events (timestamps + descriptions)
- Alert items (approaching deadlines, unresolved conflicts)
- Trend data (previous period values for metric cards)

## Primitives Registry Update

Add to `tools/registry/primitives.json`:

**Widget primitives (5):**
- `widget:metricCard`, `widget:miniGrid`, `widget:statusDistribution`,
  `widget:activityFeed`, `widget:alertList`

Each with `paramsSchema` matching the component inputs defined above.

## Build Phases

### Phase 1: Grid Refactor (we build)

Incremental, one primitive at a time:
1. StatusBadgeRendererComponent → refactor DealStage, ConflictStatus, CoverageMultiple, DaysCountdown
2. DefaultTextRendererComponent → refactor DealSize, FeeRevenue, MilestoneProgress
3. ActionIconRendererComponent (new — no existing wrapper yet)
4. LinkRendererComponent (new — no existing wrapper yet)
5. Update all 4 existing grids, verify app runs

### Phase 2: Dashboard (we build)

1. Write dashboard base spec + page template spec
2. Write 6 dashboard composition specs
3. Build 5 widget components
4. Add dashboard mock data + store computed metrics
5. Update app shell with sub-navigation
6. Build dashboard views for 5 personas (Coverage, Syndicate, BEL, Conflict, Compliance — note: Compliance Viewer grid also needs to be built as it doesn't exist in the demo yet)
7. Update primitives.json with widget entries

### Phase 3: Agent Test (agent builds)

1. Agent generates deal-origination-banker grid from existing composition spec
2. Agent generates deal-origination-banker dashboard from new composition spec
3. Run compliance checker
4. Validate the full loop

## Scope Boundaries

**In scope:**
- 4 generic cell renderer primitives
- 7 deal wrapper refactors
- 5 dashboard widget components
- 2 new base pattern specs
- 6 new dashboard composition specs
- App shell sub-navigation
- Store computed metrics + extended mock data
- Primitives registry update
- Agent-generated deal-origination-banker

**Out of scope:**
- Real backend / API integration
- Authentication / authorization
- Angular routing (keep signal-based navigation)
- Unit tests (demo app, not production)
- Charts / data visualization widgets
- Real-time refresh / WebSocket
