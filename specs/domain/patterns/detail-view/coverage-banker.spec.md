# Composition Spec: Deal Detail View — Coverage Banker
**spec-id:** `domain/patterns/detail-view/coverage-banker`
**version:** `1.0.0`
**status:** `active`
**spec-type:** `composition`
**layer:** `3`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-04-06
**base-pattern:** `ds/patterns/detail-view` v1.0.0
**persona:** `domain/personas/coverage-banker` v1.0.0
**entitlement:** `domain/entitlements/deal-full` v1.0.0
**compliance-signoff:** `J. Martinez / Head of Compliance / 2026-03-15`

---

## 1. Intent

Defines the deal detail view as experienced by a Coverage Banker. Revenue-focused single-deal summary with key financial metrics, deal lifecycle status, and quick actions for pipeline management. This view is the drill-down from the AG Grid datatable — clicking a deal name in the grid navigates here.

> **Agent instruction:** Read specs in this order before generating:
> 1. `fw/angular/component-patterns` — structural contract
> 2. `ds/tokens/semantic` — token adapter
> 3. `ds/components/component-map` — component adapter
> 4. `ds/patterns/detail-view` — base detail view contract
> 5. `domain/personas/coverage-banker` — persona context
> 6. `domain/entitlements/deal-full` — entitlement rules
> 7. This spec — delta only
>
> Do NOT create new rendering components. Use field types from the base pattern §6. Reference calculation functions from `ds/patterns/deal-grid-calculations` where applicable.

---

## 2. Columns

This spec uses the "sections + fields" model from the base pattern, not grid columns. The term "Columns" is retained for composition spec consistency.

### 2.1 Key metrics bar (below header)

| # | Metric | Field | Formatter | Sensitivity tags |
|---|--------|-------|-----------|-----------------|
| 1 | Deal Size | `dealSizeUsd` | currency | — |
| 2 | Gross Spread | `grossSpreadBps` | custom: `formatBps()` | **fee-sensitive** |
| 3 | Est. Revenue | calculated: `calcGrossRevenue()` | custom: `formatRevenueMillions()` | **fee-sensitive** |
| 4 | Days to Close | calculated: `calcDaysToClose()` | number (with threshold styling) | — |

### 2.2 Sections

#### Section A: Deal Overview

| # | Field | Label | Type | Notes |
|---|-------|-------|------|-------|
| 1 | `dealName` | Deal Name | text | |
| 2 | `issuerName` | Issuer | text | |
| 3 | `dealType` | Deal Type | badge | variant: `neutral` |
| 4 | `stage` | Current Stage | badge | uses stage badge variant map (same as grid §2) |
| 5 | `mandateDate` | Mandate Date | date | |
| 6 | `expectedCloseDate` | Expected Close | date | |
| 7 | `coverageBankerName` | Coverage Banker | text | |

#### Section B: Financial Details

| # | Field | Label | Type | Sensitivity tags |
|---|-------|-------|------|-----------------|
| 1 | `dealSizeUsd` | Deal Size | currency | — |
| 2 | `grossSpreadBps` | Gross Spread (bps) | text: `formatBps()` | **fee-sensitive** |
| 3 | calculated: `calcGrossRevenue()` | Estimated Revenue | currency: `formatRevenueMillions()` | **fee-sensitive** |
| 4 | `bookRunnerCount` | Book Runners | number | — |
| 5 | `syndicateSize` | Syndicate Size | number | — |

#### Section C: Coverage & Relationships

| # | Field | Label | Type | Notes |
|---|-------|-------|------|-------|
| 1 | `coverageMultiple` | Coverage Multiple | text: `formatCoverageMultiple()` | Render "—" when 0 or null |
| 2 | `sectorName` | Sector | text | |
| 3 | `regionName` | Region | text | |

### Stage badge variant map

| Stage | Badge variant |
|---|---|
| Origination | info |
| Mandate | info |
| Due Diligence | warning |
| Marketing | warning |
| Pricing | success |
| Closed | neutral |
| Withdrawn | error |

---

## 3. Filters (default active)

Not applicable — detail views show a single entity. Route param `dealId` determines which record is loaded.

---

## 4. Row actions

Not applicable — detail views use contextual actions (see §5).

---

## 5. Bulk actions

Repurposed for this composition spec as **contextual actions** in the action bar:

```typescript
[
  { id: 'edit',           label: 'Edit Deal',      icon: 'edit',    variant: 'primary' },
  { id: 'advance-stage',  label: 'Advance Stage',  icon: 'forward', variant: 'secondary',
    disabled: (deal) => deal.stage === 'Closed' || deal.stage === 'Withdrawn' },
  { id: 'add-note',       label: 'Add Note',       icon: 'note',    variant: 'secondary' },
  { id: 'export-pdf',     label: 'Export PDF',      icon: 'download', variant: 'secondary',
    scope: 'own-deals-only' },
  { id: 'archive',        label: 'Archive',         icon: 'archive', variant: 'danger',
    disabled: (deal) => deal.stage !== 'Closed' && deal.stage !== 'Withdrawn' },
]
```

---

## 6. Behavioral variant

- **Data strategy:** Async — entity loaded via service call from route param `dealId`
- **Action bar mode:** Sticky (default)
- **Section collapsibility:** Section B and C are collapsible, default expanded. Section A is always expanded.

---

## 7. Column value getters

```typescript
// Metric 3: Estimated Revenue
{
  id: 'estimatedRevenue',
  label: 'Est. Revenue',
  field: 'estimatedRevenue',
  formatter: 'custom',
  customFormatter: (deal) => formatRevenueMillions(calcGrossRevenue(deal.dealSizeUsd, deal.grossSpreadBps)),
}

// Metric 4: Days to Close
{
  id: 'daysToClose',
  label: 'Days to Close',
  field: 'daysToClose',
  formatter: 'custom',
  customFormatter: (deal) => {
    const days = calcDaysToClose(deal.expectedCloseDate);
    if (days === null) return '—';
    if (days < 0) return `${Math.abs(days)}d overdue`;
    return `${days}d`;
  },
}
```

---

## 8. Null / zero value rendering rules

| Field | Null / undefined | Zero | Negative |
|-------|-----------------|------|----------|
| Deal Name | — (should never be null) | — | — |
| Issuer | Render "—" | — | — |
| Deal Size (metric + field) | Render "—" | Render "$0" | — |
| Gross Spread | Render "—" | Render "0 bps" | — |
| Est. Revenue | Render "—" | Render "$0" | Render as negative (red text) |
| Days to Close (metric) | Render "—" | Render "Today" | Render "Xd overdue" with error styling |
| Mandate Date | Render "—" | — | — |
| Expected Close | Render "—" | — | — |
| Coverage Multiple | Render "—" | Render "—" (zero is treated as unset) | — |
| Book Runners | Render "—" | Render "0" | — |
| Syndicate Size | Render "—" | Render "0" | — |
| Sector / Region | Render "—" | — | — |

---

## 9. Loading state

```typescript
{
  type: 'skeleton',
  // Header: title placeholder (60% width) + badge placeholder
  // Metrics bar: 4 skeleton metric blocks
  // Section A: 7 skeleton label/value rows
  // Section B: 5 skeleton label/value rows
  // Section C: 3 skeleton label/value rows
}
```

---

## 10. Empty state

```typescript
{
  icon: '🔍',
  title: 'Deal not found',
  description: 'This deal doesn\'t exist or has been removed from the system.',
  backAction: true,
}
```

---

## 11. Error state

```typescript
{
  icon: '⚠',
  title: 'Unable to load deal',
  description: 'Something went wrong loading this deal. Please try again.',
  retryAction: true,
}
```

---

## 12. Acceptance criteria

- [ ] **AC-1:** When navigating from the grid via deal name click, the detail view loads with the correct deal's data, showing all three sections.
- [ ] **AC-2:** Key metrics bar shows Deal Size, Gross Spread, Est. Revenue, Days to Close in that order. When entitlement is `deal-restricted`, Gross Spread and Est. Revenue metrics are hidden — bar shows 2 metrics, not 4 with blanks.
- [ ] **AC-3:** When `expectedCloseDate` is null, Days to Close metric renders "—". When overdue (negative days), renders "Xd overdue" with error styling.
- [ ] **AC-4:** Section B financial fields respect `fee-sensitive` tags — Gross Spread and Est. Revenue are hidden (not blank) when entitlement is `deal-restricted`.
- [ ] **AC-5:** "Advance Stage" action is disabled (not hidden) for Closed/Withdrawn deals, with `aria-disabled="true"`. "Archive" action is disabled for active deals.
- [ ] **AC-6:** Section B and C can be collapsed/expanded. Collapse state uses `aria-expanded`.
- [ ] **AC-7:** When the service call fails, error state with retry button appears. Retry re-fetches from the service.
- [ ] **AC-8:** All field labels use `<dt>`, all field values use `<dd>`, header is `<h1>`, section titles are `<h2>`.

---

## 13. Agent checklist

> Before outputting generated code, verify every item below:

- [ ] All 15 spec sections read before generating
- [ ] Base pattern `ds/patterns/detail-view` §4 file layout followed
- [ ] Key metrics bar matches §2.1 exactly (4 metrics, correct order)
- [ ] Section A fields match §2.2 Section A exactly (7 fields)
- [ ] Section B fields match §2.2 Section B exactly (5 fields, fee-sensitive tagged)
- [ ] Section C fields match §2.2 Section C exactly (3 fields)
- [ ] Stage badge uses variant map from §2
- [ ] Calculated values use `calcGrossRevenue` and `calcDaysToClose` per §7
- [ ] Null/zero rendering matches §8 for every field
- [ ] Loading state (skeleton) implemented per §9
- [ ] Empty state (deal not found + back button) implemented per §10
- [ ] Error state (retry button) implemented per §11
- [ ] All acceptance criteria from §12 are satisfied
- [ ] Contextual actions match §5 — disabled logic present with `aria-disabled`
- [ ] Fee-sensitive fields enforce entitlement per §2.2 Section B

---

## 14. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-06 | Initial | UI Architecture / Product |

---

## 15. Related Specs

- `ds/patterns/detail-view` — base detail view pattern
- `ds/patterns/deal-grid-calculations` — shared calculation functions
- `domain/personas/coverage-banker` — persona context
- `domain/entitlements/deal-full` — entitlement rules
- `domain/patterns/ag-grid-datatable/coverage-banker` — companion grid view (drill-down source)
