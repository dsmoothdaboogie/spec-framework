# Deal Management Demo

A live demonstration of **spec-driven, persona-based AG Grid composition** using Angular 19.

The core idea: a library of pre-built shared components (cell renderers, calculation functions) acts as Layer A. Specs are wiring instructions that tell an agent or developer exactly how to compose those components into a persona-specific grid view. This app has four personas — Coverage Banker, Syndicate Banker, Business Execution Lead, and Conflict Clearance — all viewing the same mock deal data through completely different lenses.

---

## Quick start

```bash
cd deal-management-demo
npm install
ng serve
# → http://localhost:4200
```

---

## Live demo: regenerate a persona grid from its spec

This is the main talking point. You delete a persona grid, open its spec, and rebuild it in front of the audience — demonstrating that the spec contains the complete implementation contract and an agent (or developer) follows it mechanically.

### Setup before the demo

Keep two terminal windows open:

```bash
# Terminal 1 — dev server with HMR (changes appear instantly)
cd deal-management-demo && ng serve

# Terminal 2 — spec registry queries
cd .. && node tools/registry/registry-cli.js search "banking"
```

Open `http://localhost:4200` in the browser. The app shows all four persona tabs working.

---

### Demo script: delete and regenerate the Syndicate Banker grid

**Step 1 — Show the working grid**

Click the **Syndicate Banker** tab. Point out the key columns spec'd for this persona:
- `Book Coverage` — `CoverageMultipleRendererComponent` (green ≥2x, amber ≥1x, red <1x)
- `Gross Spread` — plain `formatBps()` formatter, *not* the inline revenue renderer used by Coverage Banker
- `Allocation` — `DealSizeRendererComponent` reused from shared library

**Step 2 — Find the spec**

```bash
node tools/registry/registry-cli.js get domain/patterns/ag-grid-datatable/syndicate-banker
```

Open the spec file to show the audience:
```
spec-framework/specs/domain/patterns/ag-grid-datatable/syndicate-banker.spec.md
```

Point out:
- §2 Columns table — exact column order, which renderer maps to which field
- §7 Coverage multiple thresholds — the green/amber/red cutoffs
- The agent instruction at the top: "Do NOT create new cell renderers — use pre-built renderers from `src/app/shared/cell-renderers/`"

**Step 3 — Delete the grid component**

```bash
rm -rf deal-management-demo/src/app/features/syndicate-banker/deal-grid/
```

The browser will instantly show a compile error on the Syndicate tab. The other three persona tabs continue working — demonstrating the isolation between persona grids.

**Step 4 — Rebuild from the spec**

Paste the spec into Claude Code (or Copilot / Cursor) with this prompt:

```
Read specs/domain/patterns/ag-grid-datatable/syndicate-banker.spec.md
and rebuild src/app/features/syndicate-banker/deal-grid/ 
using only the pre-built renderers in src/app/shared/cell-renderers/.
Do not create any new renderer components.
```

The agent reads the spec and regenerates `deal-grid.component.ts`, `.html`, and `.scss`. HMR reloads the browser — the Syndicate tab is restored with the correct columns.

**Step 5 — The point to make**

The agent didn't make any decisions. Column order, renderer selection, threshold values, which columns are absent — all of it came from the spec. A different agent, a different developer, a different day — they all produce the same grid because the spec is the contract.

---

### Other good demo variations

#### Variation A — Show entitlement enforcement (Conflict Clearance)

Delete just the grid component, then ask the agent to rebuild it. The critical test: does the regenerated grid have a checkbox column? An actions column? A bulk action bar?

Per `specs/domain/patterns/ag-grid-datatable/conflict-clearance.spec.md §10`:
> These must be **absent** — not disabled, not hidden, absent entirely.

```bash
rm -rf deal-management-demo/src/app/features/conflict-clearance/deal-grid/
```

Regenerate, then compare the `columnDefs` array in the output against the Coverage Banker grid to show the spec-enforced difference.

#### Variation B — Show the shared renderer library

Open `src/app/shared/cell-renderers/days-countdown-renderer/` and explain that `DaysCountdownRendererComponent` is used by **three** different persona grids with different threshold params:

| Persona | Column | `warnDays` | `errorDays` | Direction |
|---|---|---|---|---|
| Coverage Banker | Days to Close | 30 | 7 | fewer = worse |
| BEL | Days in Stage | 14 | 30 | more = worse (inverted) |
| BEL | Days to Close | 30 | 7 | fewer = worse |

Same component, different configuration — driven by the spec, not hardcoded per persona.

#### Variation C — Delete a shared renderer

```bash
rm -rf deal-management-demo/src/app/shared/cell-renderers/deal-size-renderer/
```

The build will break for **three** persona grids simultaneously (Coverage Banker, Syndicate Banker, BEL all use it). This demonstrates the Layer A / Layer B separation: shared components have broad blast radius, persona grids have none.

---

## Project structure

```
deal-management-demo/
└── src/app/
    ├── shared/                          ← Layer A: pre-built building blocks
    │   ├── types/deal.types.ts          ← Domain types (Deal, DealStage, etc.)
    │   ├── calculations/
    │   │   └── deal-calculations.ts     ← 12 pure calculation functions
    │   ├── mock/deal-mock-data.ts       ← 12 realistic mock deals
    │   └── cell-renderers/
    │       ├── deal-size-renderer/      ← $450m / $1.2bn formatting
    │       ├── deal-stage-renderer/     ← Coloured badge per stage/status
    │       ├── fee-revenue-renderer/    ← bps + inline gross revenue
    │       ├── days-countdown-renderer/ ← Configurable urgency thresholds
    │       ├── coverage-multiple-renderer/ ← 3.5x with green/amber/red
    │       ├── milestone-progress-renderer/ ← 4/7 (57%) + progress bar
    │       └── conflict-status-renderer/   ← Cleared/Pending/Flagged/Waived
    │
    ├── state/deal.store.ts              ← NgRx SignalStore (shared across tabs)
    │
    └── features/                        ← Layer B: persona-specific wiring
        ├── coverage-banker/deal-grid/   ← Revenue focus, est. revenue col
        ├── syndicate-banker/deal-grid/  ← Book coverage multiple as hero col
        ├── business-execution-lead/deal-grid/ ← Timeline + milestones
        └── conflict-clearance/deal-grid/      ← Read-only, no actions/checkbox
```

## Corresponding specs

Each feature grid has a spec that describes exactly how it was built:

| Grid | Spec |
|---|---|
| Coverage Banker | `specs/domain/patterns/ag-grid-datatable/coverage-banker.spec.md` |
| Syndicate Banker | `specs/domain/patterns/ag-grid-datatable/syndicate-banker.spec.md` |
| Business Execution Lead | `specs/domain/patterns/ag-grid-datatable/business-execution-lead.spec.md` |
| Conflict Clearance | `specs/domain/patterns/ag-grid-datatable/conflict-clearance.spec.md` |
| Shared calculations | `specs/ds/patterns/deal-grid-calculations.spec.md` |

Query the registry from the spec-framework root:

```bash
node tools/registry/registry-cli.js search "banking"
node tools/registry/registry-cli.js get domain/patterns/ag-grid-datatable/coverage-banker
```
