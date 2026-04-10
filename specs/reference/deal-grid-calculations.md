# Reference: Deal Grid Calculations

> **This is a reference document**, not a spec. Persona specs under `specs/grid/` and `specs/dashboard/` are the primary artifacts. This doc provides background on grid defaults, widget contracts, and calculation functions if needed.

**spec-id:** `ds/patterns/deal-grid-calculations`
**version:** `1.0.0`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-04-03
**applies-to:** Angular 19+

---

## Scope

### In scope
- Deal size formatting (millions/billions threshold)
- Revenue calculations from spread basis points
- Time-based calculations (days to close, days in stage, deal aging)
- Coverage ratio and multiple formatting
- Milestone percentage calculation
- Stage risk color categorisation
- Fee breakdown calculations

### Out of scope
- Aggregation/pivot calculations across multiple deals
- Portfolio-level calculations
- FX conversion

---

## Calculation Contracts

All functions are pure exports from `src/app/shared/calculations/deal-calculations.ts`. No side effects. No service injection.

### `formatDealSize(millions: number): string`

Threshold: `< 1000` → `"$NNNm"`. `>= 1000` → `"$N.Nbn"`.

```typescript
formatDealSize(450)    // '$450m'
formatDealSize(1200)   // '$1.2bn'
formatDealSize(1000)   // '$1.0bn'
formatDealSize(15000)  // '$15.0bn'
```

### `calcGrossRevenue(dealSizeM: number, grossSpreadBps: number): number`

Returns gross revenue in millions USD.

```
grossRevenue = dealSizeM × (grossSpreadBps / 10000)
```

```typescript
calcGrossRevenue(1000, 200) // 20  ($20m)
calcGrossRevenue(500, 150)  // 7.5 ($7.5m)
```

### `calcManagementFeeRevenue(grossRevenue: number, managementFeePercent: number): number`

Returns management fee revenue in millions USD.

```
mgmtFee = grossRevenue × (managementFeePercent / 100)
```

### `calcDaysInStage(stageChangedDate: Date, today?: Date): number`

Returns integer days. Uses today's date if `today` not provided. Always `Math.floor`.

### `calcDaysToClose(expectedCloseDate: Date | null, today?: Date): number | null`

Returns integer days remaining. Returns `null` if `expectedCloseDate` is null. Negative values permitted (overdue). Uses `Math.ceil`.

### `calcDealAging(createdDate: Date, today?: Date): number`

Returns integer days since deal was created. Uses `Math.floor`.

### `formatBps(value: number): string`

```typescript
formatBps(125) // '125bps'
formatBps(0)   // '0bps'
```

### `calcCoverageRatio(allocated: number, demanded: number): number`

Returns ratio as decimal. Guards against divide-by-zero (returns 0 if `demanded === 0`).

### `formatCoverageMultiple(multiple: number): string`

Always one decimal place.

```typescript
formatCoverageMultiple(3.5) // '3.5x'
formatCoverageMultiple(1)   // '1.0x'
```

### `dealSizeCategory(millions: number): 'small' | 'mid' | 'large' | 'jumbo'`

| Range (millions) | Category |
|---|---|
| 0–99 | small |
| 100–499 | mid |
| 500–1999 | large |
| 2000+ | jumbo |

### `calcMilestonesPercent(completed: number, total: number): number`

Returns integer percentage (0–100). Guards against divide-by-zero (returns 0 if `total === 0`).

### `stageRiskColor(daysInStage: number, stage: DealStage): 'success' | 'warning' | 'error'`

Stage-specific thresholds:

| Stage | Warning threshold (days) | Error threshold (days) |
|---|---|---|
| Origination | 30 | 60 |
| Mandate | 14 | 30 |
| Due Diligence | 21 | 45 |
| Marketing | 7 | 14 |
| Pricing | 3 | 7 |
| Closed | — | — (always success) |
| Withdrawn | — | — (always success) |

---

## Design System Tokens Used by Renderers

| State | CSS Custom Property |
|---|---|
| Success / on track | `var(--color-success)` |
| Warning / approaching | `var(--color-warning)` |
| Error / overdue | `var(--color-error)` |
| Neutral | `var(--color-text-secondary)` |

---

## Pre-built Cell Renderers

These renderers live in `src/app/shared/cell-renderers/` and are available to all persona grids. Never reimplement them per persona.

| Renderer | Component class | Primary calculation used |
|---|---|---|
| `DealSizeRendererComponent` | `deal-size-renderer/` | `formatDealSize()`, `dealSizeCategory()` |
| `DealStageRendererComponent` | `deal-stage-renderer/` | Stage→badge variant map |
| `FeeRevenueRendererComponent` | `fee-revenue-renderer/` | `formatBps()`, `calcGrossRevenue()` |
| `DaysCountdownRendererComponent` | `days-countdown-renderer/` | Configurable thresholds, null-safe |
| `CoverageMultipleRendererComponent` | `coverage-multiple-renderer/` | `formatCoverageMultiple()` |
| `MilestoneProgressRendererComponent` | `milestone-progress-renderer/` | `calcMilestonesPercent()` |
| `ConflictStatusRendererComponent` | `conflict-status-renderer/` | ConflictStatus→badge variant map |

---

## Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | UI Architecture / Product |
