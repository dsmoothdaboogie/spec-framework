# Pattern Spec: Deal Grid Calculations
**spec-id:** `ds/patterns/deal-grid-calculations`
**version:** `1.0.0`
**status:** `active`
**layer:** `2`
**owner:** UI Architecture / Product
**last-reviewed:** 2026-04-03
**applies-to:** Angular 19+

---

## 1. Intent

Defines the canonical set of pure-function calculations and formatters shared across all deal management grid views. All calculation logic must originate from `src/app/shared/calculations/deal-calculations.ts` — no inline math or formatting in column defs, cell renderers, or templates.

> **Agent instruction:** Import from `src/app/shared/calculations/deal-calculations.ts` for all deal-domain number formatting and calculation. Never write inline math in a column `valueFormatter`. Never hardcode currency thresholds or day thresholds. All functions are pure exports — no class, no injection.

---

## 2. Scope

### In scope
- Deal size formatting (millions/billions threshold)
- Revenue calculations from spread basis points
- Time-based calculations (days to close, days in stage, deal aging)
- Coverage ratio and multiple formatting
- Milestone percentage calculation
- Stage risk color categorisation
- Fee breakdown calculations

### Out of scope
- Aggregation/pivot calculations across multiple deals → AG Grid enterprise aggregation
- Portfolio-level calculations → backend aggregation
- FX conversion → FX service (no spec yet)

---

## 3. Calculation Contracts

Each function is a pure function. No side effects. No service injection. All exported from `deal-calculations.ts`.

### 3.1 `formatDealSize(millions: number): string`

Threshold: `< 1000` → `"$NNNm"`. `>= 1000` → `"$N.Nbn"`.

```typescript
formatDealSize(450)    // '$450m'
formatDealSize(1200)   // '$1.2bn'
formatDealSize(1000)   // '$1.0bn'
formatDealSize(15000)  // '$15.0bn'
```

### 3.2 `calcGrossRevenue(dealSizeM: number, grossSpreadBps: number): number`

Returns gross revenue in millions USD.

```
grossRevenue = dealSizeM × (grossSpreadBps / 10000)
```

```typescript
calcGrossRevenue(1000, 200) // 20  ($20m)
calcGrossRevenue(500, 150)  // 7.5 ($7.5m)
```

### 3.3 `calcManagementFeeRevenue(grossRevenue: number, managementFeePercent: number): number`

Returns management fee revenue in millions USD.

```
mgmtFee = grossRevenue × (managementFeePercent / 100)
```

### 3.4 `calcDaysInStage(stageChangedDate: Date, today?: Date): number`

Returns integer days. Uses today's date if `today` not provided. Always `Math.floor`.

### 3.5 `calcDaysToClose(expectedCloseDate: Date | null, today?: Date): number | null`

Returns integer days remaining. Returns `null` if `expectedCloseDate` is null. Negative values permitted (overdue). Uses `Math.ceil`.

### 3.6 `calcDealAging(createdDate: Date, today?: Date): number`

Returns integer days since deal was created. Uses `Math.floor`.

### 3.7 `formatBps(value: number): string`

```typescript
formatBps(125) // '125bps'
formatBps(0)   // '0bps'
```

### 3.8 `calcCoverageRatio(allocated: number, demanded: number): number`

Returns ratio as decimal. Guards against divide-by-zero (returns 0 if `demanded === 0`).

### 3.9 `formatCoverageMultiple(multiple: number): string`

Always one decimal place.

```typescript
formatCoverageMultiple(3.5) // '3.5x'
formatCoverageMultiple(1)   // '1.0x'
```

### 3.10 `dealSizeCategory(millions: number): 'small' | 'mid' | 'large' | 'jumbo'`

| Range (millions) | Category |
|---|---|
| 0–99 | small |
| 100–499 | mid |
| 500–1999 | large |
| 2000+ | jumbo |

### 3.11 `calcMilestonesPercent(completed: number, total: number): number`

Returns integer percentage (0–100). Guards against divide-by-zero (returns 0 if `total === 0`).

### 3.12 `stageRiskColor(daysInStage: number, stage: DealStage): 'success' | 'warning' | 'error'`

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

## 4. Design System Tokens Used by Renderers

Cell renderers consuming these calculations apply visual state via CSS custom properties that map to semantic tokens:

| State | CSS Custom Property |
|---|---|
| Success / on track | `var(--color-success)` |
| Warning / approaching | `var(--color-warning)` |
| Error / overdue | `var(--color-error)` |
| Neutral | `var(--color-text-secondary)` |

---

## 5. Pre-built Cell Renderers (Layer A — do not recreate per persona)

These renderers live in `src/app/shared/cell-renderers/` and are available to all persona grids. Persona composition specs reference them by import path — they are never reimplemented.

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

## 6. Agent Checklist

- [ ] All calculation functions are pure — no side effects, no injection
- [ ] `formatDealSize` uses 1000m threshold for bn conversion
- [ ] `calcGrossRevenue` formula: `dealSizeM × (bps / 10000)`
- [ ] `calcDaysToClose` returns null for null expectedCloseDate
- [ ] `formatCoverageMultiple` always uses one decimal place
- [ ] `stageRiskColor` uses per-stage thresholds from §3.12 table
- [ ] All status colors use CSS custom properties — zero hardcoded hex in renderer SCSS
- [ ] Functions are named exports — not class methods

---

## 7. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | UI Architecture / Product |

---

## 8. Related Specs

- `ds/tokens/semantic` — colour token source
- `ds/patterns/ag-grid-datatable` — base grid pattern
- `domain/patterns/ag-grid-datatable/coverage-banker` — primary consumer
