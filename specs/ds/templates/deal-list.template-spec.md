# Template Spec: Deal List
**spec-id:** `ds/templates/deal-list`
**spec-type:** `template`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture
**last-reviewed:** 2026-03-22
**applies-to:** `Angular 19+`
**composes:** `ds/patterns/ag-grid-datatable` v2.0.0
**instantiated-by:** see registry (`node tools/registry/registry-cli.js tree ds/templates/deal-list`)

---

## 1. Intent

This template defines the standard page structure for deal list views across all persona implementations. Teams build separate Angular components per persona, each satisfying this template's slot contracts. The result is pages that look and behave identically regardless of which team built them.

> **Agent instruction:** Read `ds/tokens/semantic`, `ds/components/component-map`, and `ds/patterns/ag-grid-datatable` before reading this template. This spec composes those patterns — it does not redefine them. If implementing a specific persona, also read that persona's page spec after reading this template. The required reading order is: tokens → components → ag-grid-datatable → this template → page spec.

---

## 2. Scope

### In scope
- Page-level layout: toolbar, filter bar, data region, optional detail panel
- Organism composition contract for `ds/patterns/ag-grid-datatable`
- Required minimum column set shared across all personas
- Full-page loading, empty, and error states
- Page-level routing contract
- Cross-organism interaction between data region and detail panel

### Out of scope
- Persona-specific column definitions → page spec for that persona
- Persona-specific row actions → page spec for that persona
- Persona-specific permissions and route guards → page spec for that persona
- Editable grids → `ds/patterns/ag-grid-editable`
- Deal detail page (destination of row action navigation) → `ds/templates/deal-detail` (future)
- App shell chrome (nav, sidebar) → `ds/layout/app-shell` (future)

---

## 3. Design System Tokens

All visual properties must use semantic tokens. Never use raw values.

```scss
@use '@company/spec-tokens/color'    as color;
@use '@company/spec-tokens/type'     as type;
@use '@company/spec-tokens/spacing'  as spacing;
```

Template-level tokens apply to the page shell regions only. Organism-level tokens are governed by `ds/patterns/ag-grid-datatable §3`.

| Property | Token | Region |
|---|---|---|
| Page background | `color.$surface-primary` | full page |
| Toolbar background | `color.$surface-secondary` | `.dl-toolbar` |
| Filter bar background | `color.$surface-primary` | `.dl-filter-bar` |
| Detail panel background | `color.$surface-primary` | `.dl-detail-panel` |
| Detail panel border | `color.$border-subtle` | left edge of `.dl-detail-panel` |
| Page outer padding | `spacing.$s5` | content margin |
| Region gap | `spacing.$s4` | between toolbar and filter bar |

> **Agent instruction:** Never use raw hex, px, or rem for any property listed above. The tokens listed here are for the page shell only — do not redefine tokens already owned by the ag-grid-datatable pattern spec.

---

## 4. Page Structure

### 4.1 File layout

```
[feature]/
├── [feature]-deals-page.component.ts
├── [feature]-deals-page.component.html
├── [feature]-deals-page.component.scss
├── [feature]-deals-page.types.ts
└── components/
    ├── [feature]-deals-toolbar/
    │   ├── [feature]-deals-toolbar.component.ts
    │   ├── [feature]-deals-toolbar.component.html
    │   └── [feature]-deals-toolbar.component.scss
    ├── [feature]-deals-filter-bar/
    │   ├── [feature]-deals-filter-bar.component.ts
    │   ├── [feature]-deals-filter-bar.component.html
    │   └── [feature]-deals-filter-bar.component.scss
    └── [feature]-deals-table/      ← follows ds/patterns/ag-grid-datatable §4.1
        ├── [feature]-deals-table.component.ts
        ├── [feature]-deals-table.component.html
        ├── [feature]-deals-table.component.scss
        ├── [feature]-deals-table.types.ts
        └── [feature]-deals-table.component.spec.ts
```

### 4.2 Region map

The page uses four named regions. All are present in the DOM regardless of layout variant; CSS controls visibility and sizing.

| Region | CSS class | Required | Default sizing |
|---|---|---|---|
| Toolbar | `.dl-toolbar` | yes | 56px height, sticky top |
| Filter bar | `.dl-filter-bar` | yes | 56px when open, 0 when collapsed |
| Data region | `.dl-data-region` | yes | `flex-grow: 1`, `height: 100%` |
| Detail panel | `.dl-detail-panel` | no | 400px fixed right, hidden by default |

### 4.3 Host layout

The page component host must fill its container using CSS grid:

```scss
:host {
  display: grid;
  grid-template-rows: auto auto 1fr;
  grid-template-columns: 1fr auto;
  height: 100%;

  .dl-toolbar     { grid-column: 1 / -1; }
  .dl-filter-bar  { grid-column: 1 / -1; }
  .dl-data-region { grid-column: 1; }
  .dl-detail-panel {
    grid-column: 2;
    display: none;
    &.is-open { display: block; }
  }
}
```

### 4.4 Page component inputs / outputs

```typescript
@Component({
  selector: 'app-[feature]-deals-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureDealsPageComponent {
  // No required inputs — page receives data via router resolver or injected service
  // Outputs (if the page is embedded as a child route with a host that needs notification)
  navigatedToDetail = output<string>(); // dealId
}
```

---

## 5. Organism Composition

### 5.1 Constraint tiers

Each slot configuration entry is marked with its constraint tier:

- **Fixed** — template mandates this. Page spec cannot override.
- **Configurable** — template mandates the slot; page spec provides specifics.
- **Optional** — slot exists; page spec declares fill or explicit skip.

### 5.2 Data region — ag-grid-datatable

| Aspect | Constraint | Tier |
|---|---|---|
| Organism | `ds/patterns/ag-grid-datatable` v2.0.0+ | Fixed |
| `gridOptions` | verbatim from `ag-grid-datatable §5` — no overrides | Fixed |
| `DS_CHECKBOX_COL` | must be included as first column | Fixed |
| Columns 2–6 (required minimum) | see §5.3 | Fixed |
| Persona-specific columns | appended after column 6, before actions column | Configurable |
| `ariaLabel` | must describe persona and content (e.g. "Buyside deals") | Configurable |
| Data mode | determined by `totalRows` per `ag-grid-datatable §7` | Configurable |
| Row actions | `resolveRowActions()` pattern per `ag-grid-datatable §8` | Configurable |

### 5.3 Required minimum columns

Every persona's deal list must include these columns in this exact order. Personas may add columns after position 6; they may not remove or reorder positions 1–6.

| Position | `field` | `headerName` | Type / Renderer |
|---|---|---|---|
| 1 | *(DS_CHECKBOX_COL)* | — | selection — use `DS_CHECKBOX_COL` constant verbatim |
| 2 | `dealId` | Deal ID | text |
| 3 | `counterparty` | Counterparty | text |
| 4 | `tradeDate` | Trade Date | date — `DS_DATE_FORMATTER` |
| 5 | `notionalAmount` | Notional | currency — `DS_CURRENCY_FORMATTER` |
| 6 | `status` | Status | badge — `DsBadgeCellRendererComponent` |
| last | *(actions)* | — | row actions — `DsRowActionsCellRendererComponent` |

> **Agent instruction:** Positions 1–6 and the actions column are non-negotiable. Never allow a page spec to remove any column from this set or change the header names. Persona columns are inserted between position 6 and the actions column.

---

## 6. Slot Configuration Contracts

### Slot: page-toolbar

**Required:** yes

Implementing page specs provide a `DsToolbarComponent`-based sub-component in the `.dl-toolbar` region. The toolbar must:

- Display the page title (persona-specific — page spec declares it)
- Include the primary CTA button (persona-specific label and action — page spec declares it)
- Include a filter toggle button that controls `.dl-filter-bar` visibility
- Connect `DsBulkActionBarComponent` visibility to grid row selection (show when `selectionCount > 0`)

The toolbar must NOT:
- Include breadcrumb navigation (belongs in the app shell)
- Render its own standalone bulk action bar (managed by the data region organism)

### Slot: filter-bar

**Required:** yes (must exist in DOM even when initially collapsed)

The filter bar sits in `.dl-filter-bar`. Page specs provide a `DsSearchInputComponent` for text search and zero or more `DsSelectComponent` instances for facet filters. Requirements:

- Filter change events wire to the data region organism's `filterChange` input
- Collapsed state is toggled by the toolbar's filter toggle button
- Filter bar must emit `filtersChanged` output that the page component uses to update the data region

### Slot: data-region

**Required:** yes

Filled by `ds/patterns/ag-grid-datatable`. The full composition contract is in §5. No additional requirements beyond the pattern spec.

### Slot: detail-panel

**Required:** no

If used, must use `DsDrawerComponent` from `ds/components/component-map §7`. Behavioral requirements:
- Opens on single row selection (wired via `selectionChange` output of the data region)
- Closing the drawer clears row selection in the grid via `gridApi.deselectAll()`
- Double-clicking a row navigates to the detail route (does not open the panel)

If not used, the page spec must explicitly declare `detail-panel: not used`.

---

## 7. Layout Variants

Implementing page specs must declare one of two variants in their frontmatter (`**layout-variant:**`):

**Variant A: `list-only`** — Detail panel slot is empty. All row interactions navigate to a separate deal detail route. This is the default.

**Variant B: `split-view`** — Detail panel slot is filled. Single row selection populates the panel; double-click navigates to the detail route.

> **Agent instruction:** Read the page spec's `**layout-variant:**` frontmatter field before generating. If not declared in the page spec, raise this gap — do not assume a default.

---

## 8. Required States (Page Level)

In addition to the per-organism states required by `ag-grid-datatable §9`, the page shell has three states:

| State | Trigger | Implementation |
|---|---|---|
| Page loading | Route resolver pending | `DsLoadingSpinnerComponent` covering all regions (full page overlay) |
| Page error | Route resolver failed | `DsErrorStateComponent` covering all regions with retry action |
| Permission denied | Route guard rejects | `DsErrorStateComponent` with permission-specific message (page spec §6 defines the copy) |

The authorized-but-empty state is handled by the data region organism's empty state. The page spec provides the persona-specific empty state copy.

---

## 9. Routing Contract

The page component must be registered as a lazy-loaded route:

```typescript
{
  path: '[persona-specific-path]',  // page spec §6 declares the path
  loadComponent: () => import('./[feature]-deals-page.component'),
  canActivate: [/* page spec §6 lists required guards */],
  resolve: {
    // page spec §6 defines resolvers
    // At minimum: initial page data to avoid blank flash
  },
}
```

Route guards and resolvers are persona-specific. This template requires that they exist; the page spec declares what they are.

---

## 10. Cross-Organism Interaction Contract

### 10.1 Row selection → detail panel (Variant B only)

Event flow when a user selects a row:

1. User selects a row in the data region organism
2. Data region emits `selectionChange` with `RowDataType[]`
3. Page component receives this in `onRowSelected(rows: RowDataType[])`
4. `rows.length === 1` → populate detail panel with `rows[0]`
5. `rows.length === 0` or `> 1` → clear detail panel content
6. Detail panel close event → `gridApi.deselectAll()`

The page spec declares the detail panel component; this template declares the wiring contract.

### 10.2 Filter bar → data region

1. User changes a filter control in the filter bar
2. Filter bar emits `filtersChanged` with the current filter state
3. Page component passes new filters to the data region organism's `filterModel` input
4. Data region triggers a data refresh per `ag-grid-datatable §7`

---

## 11. Accessibility Requirements

- Page title (h1) must be present in the toolbar, visible to screen readers
- Region landmarks: toolbar = `role="toolbar"`, data region = `role="main"`, detail panel = `role="complementary"` with `aria-label` describing its content
- Filter bar collapse/expand must manage focus (focus returns to toggle button on collapse)
- All organism-level a11y requirements from `ag-grid-datatable §11` apply

---

## 12. Agent Checklist

> **Agent instruction:** If implementing a specific persona, use the page spec's checklist — it incorporates this checklist verbatim. Use this checklist only when generating a page without a page spec (requires explicit instruction from the user).

- [ ] Layout variant declared (`list-only` or `split-view`) and implemented per §7
- [ ] All four regions present in DOM per §4.2
- [ ] Host uses CSS grid layout per §4.3
- [ ] Data region filled by `ag-grid-datatable`; `gridOptions` verbatim per §5.2
- [ ] Required minimum columns present in correct order per §5.3
- [ ] `DS_CHECKBOX_COL` is first column; actions column is last
- [ ] All four slot contracts satisfied per §6
- [ ] Toolbar includes filter toggle and CTA button
- [ ] Filter bar emits `filtersChanged`; wired to data region per §10.2
- [ ] Page-level loading, error, and permission-denied states implemented per §8
- [ ] Routing contract satisfied (lazy-loaded, guards declared) per §9
- [ ] Cross-organism interaction implemented if variant B per §10.1
- [ ] All page-level a11y requirements met per §11
- [ ] All `ag-grid-datatable` agent checklist items also verified

---

## 13. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-22 | Initial release | UI Architecture |

---

## 14. Related Specs & Resources

- `ds/patterns/ag-grid-datatable` — primary organism (read before this template)
- `ds/tokens/semantic` — token adapter (read first)
- `ds/components/component-map` — component adapter (read second)
- `feat/deal-list/buyside` — buyside trader page spec
- `ds/templates/deal-detail` — destination page template (future)
- `ds/layout/app-shell` — app chrome spec (future)
