# Pattern Spec: Detail View
**spec-id:** `ds/patterns/detail-view`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture
**last-reviewed:** 2026-04-06
**applies-to:** Angular 19+
**token-adapter:** `ds/tokens/semantic` v1.0.0
**component-adapter:** `ds/components/component-map` v1.0.0

---

## 1. Intent

This spec defines the standard implementation pattern for entity detail views — read-only summary pages that display a single record's data across categorized sections, with contextual actions and related entity links. It is the complement to the datatable pattern: the grid shows rows, the detail view shows one row expanded.

> **Agent instruction:** Read `ds/tokens/semantic` and `ds/components/component-map` before generating code. All token and component references here are semantic — never import Angular Material or any library directly into a feature component. Flag any requirement this spec does not cover rather than improvising.

---

## 2. Scope

### In scope
- Read-only detail views for a single entity (e.g., a deal, a client, a trade)
- Section-based layout with collapsible field groups
- Header with entity title, status badge, and primary actions
- Key metrics bar (2–5 highlighted values below the header)
- Field groups rendered as label/value pairs
- Contextual action bar (edit, archive, export, share)
- Related entities sidebar or linked-records section
- Loading, empty (record not found), and error states

### Out of scope
- Editable forms → `ds/patterns/entity-form`
- Tabbed sub-views (e.g., "Activity", "Documents") → `ds/patterns/entity-tabs`
- Timeline / audit history → `ds/patterns/activity-timeline`
- Comparison views (side-by-side entities) → `ds/patterns/entity-compare`

---

## 3. Design System Tokens

All visual properties must use semantic tokens. Never use raw values.

```scss
@use '@company/spec-tokens/color'    as color;
@use '@company/spec-tokens/type'     as type;
@use '@company/spec-tokens/spacing'  as spacing;
@use '@company/spec-tokens/layout'   as layout;
@use '@company/spec-tokens/elevation' as elevation;
```

| Property | Semantic token | Notes |
|---|---|---|
| Page background | `color.$surface-primary` | Full-width behind all sections |
| Section card background | `color.$surface-secondary` | Each field group is a card |
| Section card elevation | `elevation.$level-1` | Subtle lift above page bg |
| Section card border-radius | `layout.$radius-m` | Consistent with DS card pattern |
| Header background | `color.$surface-primary` | Flush with page |
| Entity title | `type.$heading-lg` + `color.$text-primary` | |
| Entity subtitle | `type.$body-md` + `color.$text-secondary` | |
| Metric value | `type.$heading-md` + `color.$text-primary` | |
| Metric label | `type.$label-sm` + `color.$text-tertiary` | |
| Field label | `type.$label-sm` + `color.$text-tertiary` | Left-aligned |
| Field value | `type.$body-md` + `color.$text-primary` | Left-aligned |
| Field null value | `type.$body-md` + `color.$text-disabled` | Renders "—" |
| Section title | `type.$heading-sm` + `color.$text-primary` | |
| Section spacing | `spacing.$s6` between sections | |
| Field row spacing | `spacing.$s3` between label/value rows | |
| Action bar | `color.$surface-primary` + `elevation.$level-2` | Sticky bottom on scroll |

> **Agent instruction:** The "Notes" column is for context only. Always use the semantic token in generated code. Never hardcode hex, px, or rem values.

---

## 4. Component Structure

### 4.1 File layout

```
[feature]/
└── components/
    └── [entity]-detail/
        ├── [entity]-detail.component.ts
        ├── [entity]-detail.component.html
        ├── [entity]-detail.component.scss
        ├── [entity]-detail.types.ts
        ├── [entity]-detail.component.spec.ts
        └── sections/
            └── [section-name].component.ts    (one per field group, optional)
```

### 4.2 Required inputs / outputs

```typescript
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityDetailComponent {
  // Required inputs
  entityId = input.required<string>();

  // Optional inputs
  showActions = input<boolean>(true);
  collapsedSections = input<string[]>([]);

  // Outputs
  actionClicked = output<DetailAction>();
  relatedEntityClicked = output<RelatedEntityLink>();
}
```

### 4.3 Template skeleton

```html
<!-- Header -->
<header class="detail-header">
  <div class="detail-header__title-block">
    <h1>{{ entity().title }}</h1>
    <span class="detail-header__subtitle">{{ entity().subtitle }}</span>
  </div>
  <ds-badge [variant]="entity().statusVariant">{{ entity().statusLabel }}</ds-badge>
  <div class="detail-header__actions">
    <!-- Primary actions from composition spec -->
  </div>
</header>

<!-- Key Metrics Bar -->
<section class="detail-metrics" *ngIf="metrics().length">
  <div class="detail-metrics__item" *ngFor="let m of metrics()">
    <span class="detail-metrics__value">{{ m.value }}</span>
    <span class="detail-metrics__label">{{ m.label }}</span>
  </div>
</section>

<!-- Field Group Sections -->
<section class="detail-section" *ngFor="let section of sections()">
  <h2 class="detail-section__title">{{ section.title }}</h2>
  <div class="detail-section__fields">
    <div class="detail-field" *ngFor="let field of section.fields">
      <dt class="detail-field__label">{{ field.label }}</dt>
      <dd class="detail-field__value">
        <!-- Rendered by field type: text, currency, date, badge, link, custom -->
      </dd>
    </div>
  </div>
</section>

<!-- Related Entities -->
<section class="detail-related" *ngIf="relatedEntities().length">
  <!-- Links to related records -->
</section>

<!-- Action Bar (sticky) -->
<footer class="detail-actions" *ngIf="showActions()">
  <!-- Contextual actions from composition spec -->
</footer>
```

---

## 5. Configuration

```typescript
interface DetailViewConfig {
  /** Entity type identifier */
  entityType: string;

  /** Key metrics shown below the header (2–5 items) */
  metrics: MetricConfig[];

  /** Ordered field group sections */
  sections: SectionConfig[];

  /** Contextual actions in the action bar */
  actions: DetailAction[];

  /** Related entity links */
  relatedEntities: RelatedEntityConfig[];

  /** Loading strategy */
  loadingStrategy: 'skeleton' | 'spinner';
}

interface MetricConfig {
  id: string;
  label: string;
  field: string;
  formatter: 'currency' | 'number' | 'percentage' | 'date' | 'text' | 'custom';
  customFormatter?: (value: unknown) => string;
}

interface SectionConfig {
  id: string;
  title: string;
  collapsible: boolean;
  defaultCollapsed: boolean;
  fields: FieldConfig[];
}

interface FieldConfig {
  id: string;
  label: string;
  field: string;
  type: 'text' | 'currency' | 'date' | 'badge' | 'link' | 'list' | 'custom';
  badgeVariantMap?: Record<string, string>;
  nullDisplay?: string;  // defaults to "—"
  sensitivityTag?: 'fee-sensitive' | 'revenue-sensitive' | 'mnpi-sensitive';
}

interface DetailAction {
  id: string;
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'danger';
  disabled?: (entity: unknown) => boolean;
}

interface RelatedEntityConfig {
  id: string;
  label: string;
  entityType: string;
  field: string;  // field on the entity that holds the related ID
}
```

> **Agent instruction:** Copy this configuration structure verbatim. Do not modify interface names or add fields not listed here. Composition specs populate these interfaces with persona-specific values.

---

## 6. Field Type Rendering

| Field type | Renderer | Notes |
|---|---|---|
| `text` | Plain text, truncated with tooltip at 80 chars | |
| `currency` | `CurrencyPipe` with DS format | Respects `fee-sensitive` / `revenue-sensitive` tags |
| `date` | `DatePipe` with `mediumDate` | |
| `badge` | `DsBadge` component | Uses `badgeVariantMap` from field config |
| `link` | Router link styled as `color.$interactive-primary` | |
| `list` | Comma-separated values, max 3 with "+N more" tooltip | |
| `custom` | Composition spec must provide the rendering component | |

---

## 7. Behavioral Variants

### 7.1 Data modes

| Mode | When to use | Agent decision rule |
|---|---|---|
| `resolved` | Entity loaded from route resolver | Default. Use when entity data is available at component init. |
| `async` | Entity loaded via service call after init | Use when entity ID comes from route params and data is fetched on init. |

### 7.2 Action bar modes

| Mode | When to use |
|---|---|
| `sticky` | Default. Action bar sticks to viewport bottom on scroll. |
| `inline` | Action bar scrolls with content. Use for short detail views. |

---

## 8. State Management

### 8.1 Loading state
```typescript
{
  type: 'skeleton',
  // Render skeleton blocks matching the section layout:
  // - Header: title placeholder + badge placeholder
  // - Metrics bar: N skeleton metric blocks
  // - Sections: skeleton label/value pairs matching field count
}
```

### 8.2 Empty state (record not found)
```typescript
{
  icon: '🔍',
  title: 'Record not found',
  description: 'The [entity type] you're looking for doesn't exist or has been removed.',
  backAction: true,  // show a "Go back" button
}
```

### 8.3 Error state
```typescript
{
  icon: '⚠',
  title: 'Unable to load [entity type]',
  description: 'Something went wrong. Please try again.',
  retryAction: true,
}
```

---

## 9. Accessibility Requirements

- [ ] Header title is an `<h1>`, section titles are `<h2>`
- [ ] Field labels use `<dt>`, field values use `<dd>` inside a `<dl>`
- [ ] Status badge includes `aria-label` with status text
- [ ] Action buttons have descriptive `aria-label` (not just icon)
- [ ] Disabled actions use `aria-disabled="true"`, not `disabled` attribute
- [ ] Collapsible sections use `aria-expanded` on the toggle
- [ ] Skip link to action bar for keyboard navigation

---

## 10. Testing Requirements

- [ ] Component renders with all required sections visible
- [ ] Loading state shows skeleton matching section layout
- [ ] Empty state shows when entity is null/not found
- [ ] Error state shows on service failure, retry button triggers reload
- [ ] Sensitive fields are hidden when entitlement is restricted
- [ ] Actions fire correct output events
- [ ] Null field values render "—" (or custom `nullDisplay`)

---

## 11. Agent Checklist

> Before outputting generated code, verify every item below:

- [ ] File layout matches §4.1
- [ ] All required inputs/outputs present per §4.2
- [ ] Template skeleton matches §4.3 — header, metrics, sections, related, actions
- [ ] Configuration interfaces match §5 — no ad-hoc overrides
- [ ] All DS tokens used — zero hardcoded values per §3
- [ ] Field type rendering matches §6 for every field
- [ ] Data mode correctly selected per §7
- [ ] All three states implemented per §8 (loading, empty, error)
- [ ] All accessibility requirements met per §9
- [ ] All testing requirements met per §10

---

## 12. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-06 | Initial | UI Architecture |

---

## 13. Related Specs & Resources

- `ds/tokens/semantic` — token adapter (read first)
- `ds/components/component-map` — component adapter (read second)
- `ds/patterns/ag-grid-datatable` — sibling pattern for list views
- `ds/patterns/entity-form` — editable variant (reserved, not yet authored)
