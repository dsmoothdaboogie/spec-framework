# Detail View: Coverage Banker

**spec-id:** `detail-view/coverage-banker`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-04-08
**pattern:** `detail-view`
**persona:** `coverage-banker`
**entitlement:** `deal-full`
**compliance-signoff:** `J. Martinez / Head of Compliance / 2026-03-15`

---

## 1. Purpose

Revenue-focused single-deal summary for Coverage Bankers. This view is the drill-down from the grid — clicking a deal name navigates here. It shows key financial metrics in a bar above the sections, with deal overview, financial details, and coverage relationships in collapsible sections. Fee-sensitive fields (Gross Spread, Est. Revenue) are hidden when entitlement is `deal-restricted`.

---

## 2. Columns

This view uses sections and fields rather than grid columns.

### 2.1 Key Metrics Bar (below header, always visible)

| # | Metric | Field | Formatter | fee-sensitive |
|---|--------|-------|-----------|---------------|
| 1 | Deal Size | `dealSizeUsd` | currency | — |
| 2 | Gross Spread | `grossSpreadBps` | `formatBps()` | **true** |
| 3 | Est. Revenue | calculated: `calcGrossRevenue()` | `formatRevenueMillions()` | **true** |
| 4 | Days to Close | calculated: `calcDaysToClose()` | number with threshold styling | — |

At `deal-restricted` entitlement, metrics 2 and 3 are hidden — bar shows 2 metrics, not 4 with blanks.

### 2.2 Section A: Deal Overview (always expanded, not collapsible)

| # | Field | Label | Type | Notes |
|---|-------|-------|------|-------|
| 1 | `dealName` | Deal Name | text | |
| 2 | `issuerName` | Issuer | text | |
| 3 | `dealType` | Deal Type | badge | variant: neutral |
| 4 | `stage` | Current Stage | badge | uses stage badge variant map below |
| 5 | `mandateDate` | Mandate Date | date | |
| 6 | `expectedCloseDate` | Expected Close | date | |
| 7 | `coverageBankerName` | Coverage Banker | text | |

### 2.3 Section B: Financial Details (collapsible, default expanded)

| # | Field | Label | Type | fee-sensitive |
|---|-------|-------|------|---------------|
| 1 | `dealSizeUsd` | Deal Size | currency | — |
| 2 | `grossSpreadBps` | Gross Spread (bps) | text: `formatBps()` | **true** |
| 3 | calculated: `calcGrossRevenue()` | Estimated Revenue | currency: `formatRevenueMillions()` | **true** |
| 4 | `bookRunnerCount` | Book Runners | number | — |
| 5 | `syndicateSize` | Syndicate Size | number | — |

Fee-sensitive fields in this section are hidden (not blank) at `deal-restricted` entitlement.

### 2.4 Section C: Coverage & Relationships (collapsible, default expanded)

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

## 3. Filters

Not applicable — detail views show a single entity. Route param `dealId` determines which record is loaded.

---

## 4. Row Actions

Not applicable — detail views use contextual actions in the action bar (see §5).

---

## 5. Bulk Actions

Repurposed as **contextual actions** in the action bar:

```typescript
[
  { id: 'edit',           label: 'Edit Deal',      icon: 'edit',    variant: 'primary' },
  { id: 'advance-stage',  label: 'Advance Stage',  icon: 'forward', variant: 'secondary',
    disabled: (deal) => deal.stage === 'Closed' || deal.stage === 'Withdrawn',
    ariaDisabled: (deal) => deal.stage === 'Closed' || deal.stage === 'Withdrawn' },
  { id: 'add-note',       label: 'Add Note',       icon: 'note',    variant: 'secondary' },
  { id: 'export-pdf',     label: 'Export PDF',      icon: 'download', variant: 'secondary',
    scope: 'own-deals-only' },
  { id: 'archive',        label: 'Archive',         icon: 'archive', variant: 'danger',
    disabled: (deal) => deal.stage !== 'Closed' && deal.stage !== 'Withdrawn',
    ariaDisabled: (deal) => deal.stage !== 'Closed' && deal.stage !== 'Withdrawn' },
]
```

"Advance Stage" is disabled (not hidden) for Closed/Withdrawn deals, with `aria-disabled="true"`.
"Archive" is disabled (not hidden) for active deals, with `aria-disabled="true"`.

---

## 6. Renderers

All functions are pure exports from `src/app/shared/calculations/deal-calculations.ts`.

| Usage | Function |
|-------|----------|
| Gross Spread formatting | `formatBps()` |
| Est. Revenue calculation | `calcGrossRevenue(dealSizeUsd, grossSpreadBps)` |
| Est. Revenue display | `formatRevenueMillions()` |
| Days to Close calculation | `calcDaysToClose(expectedCloseDate)` |
| Coverage Multiple display | `formatCoverageMultiple()` |

---

## 7. Calculations

```typescript
// Metric 3 / Section B field 3: Estimated Revenue
{
  id: 'estimatedRevenue',
  label: 'Est. Revenue',
  customFormatter: (deal) => formatRevenueMillions(calcGrossRevenue(deal.dealSizeUsd, deal.grossSpreadBps)),
}

// Metric 4: Days to Close
{
  id: 'daysToClose',
  label: 'Days to Close',
  customFormatter: (deal) => {
    const days = calcDaysToClose(deal.expectedCloseDate);
    if (days === null) return '—';
    if (days < 0) return `${Math.abs(days)}d overdue`;
    return `${days}d`;
  },
}
```

---

## 8. Null / Zero Rendering

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
| Coverage Multiple | Render "—" | Render "—" (zero treated as unset) | — |
| Book Runners | Render "—" | Render "0" | — |
| Syndicate Size | Render "—" | Render "0" | — |
| Sector / Region | Render "—" | — | — |

---

## 9. States

### Loading

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

### Empty

```typescript
{
  icon: 'search',
  title: 'Deal not found',
  description: "This deal doesn't exist or has been removed from the system.",
  backAction: true,
}
```

### Error

```typescript
{
  icon: 'warning',
  title: 'Unable to load deal',
  description: 'Something went wrong loading this deal. Please try again.',
  retryAction: true,
}
```

---

## 10. Defaults

- **Data strategy:** Async — entity loaded via service call from route param `dealId`
- **Action bar mode:** Sticky (default)
- **Section collapsibility:** Section B and C are collapsible, default expanded. Section A is always expanded.
- **Entitlement:** `deal-full` — all fee-sensitive fields visible. At `deal-restricted`, Gross Spread and Est. Revenue are hidden in both the metrics bar and Section B.

---

## 11. Acceptance Criteria

- [ ] **AC-1:** When navigating from the grid via deal name click, the detail view loads with the correct deal's data, showing all three sections.
- [ ] **AC-2:** Key metrics bar shows Deal Size, Gross Spread, Est. Revenue, Days to Close in that order. At `deal-restricted`, Gross Spread and Est. Revenue are hidden — bar shows 2 metrics, not 4 with blanks.
- [ ] **AC-3:** When `expectedCloseDate` is null, Days to Close metric renders "—". When overdue (negative days), renders "Xd overdue" with error styling.
- [ ] **AC-4:** Section B financial fields respect fee-sensitive tags — Gross Spread and Est. Revenue are hidden (not blank) at `deal-restricted`.
- [ ] **AC-5:** "Advance Stage" action is disabled (not hidden) for Closed/Withdrawn deals, with `aria-disabled="true"`. "Archive" action is disabled for active deals.
- [ ] **AC-6:** Section B and C can be collapsed/expanded. Collapse state uses `aria-expanded`.
- [ ] **AC-7:** When the service call fails, error state with retry button appears. Retry re-fetches from the service.
- [ ] **AC-8:** All field labels use `<dt>`, all field values use `<dd>`, header is `<h1>`, section titles are `<h2>`.

---

## 12. Checklist

- [ ] Key metrics bar matches §2.1 exactly (4 metrics, correct order)
- [ ] Section A fields match §2.2 Section A exactly (7 fields)
- [ ] Section B fields match §2.3 Section B exactly (5 fields, fee-sensitive tagged)
- [ ] Section C fields match §2.4 Section C exactly (3 fields)
- [ ] Stage badge uses variant map from §2
- [ ] Calculated values use `calcGrossRevenue` and `calcDaysToClose` per §7
- [ ] Null/zero rendering matches §8 for every field
- [ ] Coverage Multiple renders "—" for zero (not "0.0x")
- [ ] All three states implemented per §9
- [ ] Contextual actions match §5 — disabled logic present with `aria-disabled`
- [ ] Fee-sensitive fields hidden at `deal-restricted` in both metrics bar and Section B
- [ ] All acceptance criteria from §11 satisfied
