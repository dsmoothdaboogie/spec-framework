# Token Spec: Semantic Design Tokens
**spec-id:** `ds/tokens/semantic`
**version:** `2.0.0`
**status:** `active`
**owner:** UI Architecture
**last-reviewed:** 2026-04-08
**applies-to:** Angular 19+, any CSS-based framework

---

## 1. Intent

This spec is the **single swap point** between pattern specs and the underlying design system. All pattern specs reference semantic CSS custom property names defined here. This file maps those names to their current placeholder values.

When your internal DS ships, update the `:root` block in `styles.scss` with real DS values. No pattern spec, component, or composition spec needs to change.

> **Agent instruction:** Never use raw hex colors, px values, or font declarations in component SCSS. Always use `var(--token-name)`. If a token you need is not listed here, raise it with UI Architecture — do not hardcode values.

---

## 2. Mechanism: CSS Custom Properties

All tokens are CSS custom properties defined in a single `:root` block in the app's global stylesheet (`styles.scss`). Components consume them via `var()`:

```
styles.scss (:root)                Component SCSS                    Browser
──────────────────────────────────────────────────────────────────────────────
--color-surface-primary: #fff  →   var(--color-surface-primary)  →   #fff
--color-brand-primary: #1565c0 →   var(--color-brand-primary)    →   #1565c0
```

The swap point is the `:root` block. Change values there, every component updates automatically.

---

## 3. Where Tokens Are Defined

**Source of truth:** `deal-management-demo/src/styles.scss` — the `:root` block at the top of the file.

In enterprise deployment, this `:root` block may be replaced by a generated CSS file from the DS toolchain (e.g., Style Dictionary output, Figma Tokens export, or a DS package's `variables.css`).

---

## 4. How to Consume Tokens

In any component SCSS file:

```scss
// Always use var() with the semantic token name
.my-card {
  background: var(--color-surface-primary);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
  padding: var(--spacing-s4);
  font: var(--type-label);
}
```

**Rules:**
- Never use raw hex colors (`#fff`), raw px values (`16px`), or font stacks in component SCSS
- Never reference DS library variables directly (no Material, no Bootstrap, no internal DS imports)
- All visual properties must go through a `var(--token-name)` reference
- Fallback values in `var()` are optional but encouraged as a safety net during development

---

## 5. Color Tokens

<!-- PLACEHOLDER values below — replace with your DS values when onboarding to enterprise -->

### Surface

| CSS Custom Property | Placeholder Value | Usage |
|---|---|---|
| `--color-surface-primary` | `#ffffff` | Page backgrounds, card backgrounds |
| `--color-surface-secondary` | `#f8fafc` | Subtle backgrounds, table headers, sub-nav |
| `--color-surface-hover` | `rgba(0,0,0,0.02)` | Row hover, list item hover |
| `--color-surface-raised` | `#f8f9fa` | Elevated page background, button secondary |
| `--color-surface-overlay` | `rgba(0,0,0,0.04)` | Scrim, modal overlays |

### Border

| CSS Custom Property | Placeholder Value | Usage |
|---|---|---|
| `--color-border-subtle` | `#e0e0e0` | Dividers, table borders, card outlines |
| `--color-border-default` | `#d0d5dd` | Input borders, active card borders |

### Text

| CSS Custom Property | Placeholder Value | Usage |
|---|---|---|
| `--color-text-primary` | `#1a1a1a` | Body text, headings, labels |
| `--color-text-secondary` | `#616161` | Secondary text, hints, timestamps |

### Brand

| CSS Custom Property | Placeholder Value | Usage |
|---|---|---|
| `--color-brand-primary` | `#1565c0` | CTAs, focus rings, active tab indicators |
| `--color-brand-container` | `rgba(21,101,192,0.08)` | Active chip backgrounds, badge containers |

### Status (foreground)

| CSS Custom Property | Placeholder Value | Usage |
|---|---|---|
| `--color-success` | `#059669` | Success badges, positive trends, cleared status |
| `--color-warning` | `#d97706` | Warning badges, approaching deadlines |
| `--color-error` | `#dc2626` | Error badges, destructive actions, flagged status |
| `--color-info` | `#2563eb` | Info badges, origination/mandate stage |
| `--color-neutral` | `#64748b` | Neutral/default badges, closed/waived status |

### Status (background)

| CSS Custom Property | Placeholder Value | Usage |
|---|---|---|
| `--color-success-bg` | `rgba(52,211,153,0.12)` | Success badge background, alert card |
| `--color-warning-bg` | `rgba(251,191,36,0.12)` | Warning badge background, alert card |
| `--color-error-bg` | `rgba(239,68,68,0.12)` | Error badge background, alert card |
| `--color-info-bg` | `rgba(59,130,246,0.12)` | Info badge background, alert card |
| `--color-neutral-bg` | `rgba(148,163,184,0.12)` | Neutral badge background |

---

## 6. Typography Tokens

<!-- PLACEHOLDER values below — replace with your DS font stack and sizes -->

| CSS Custom Property | Placeholder Value | Usage |
|---|---|---|
| `--type-body` | `400 14px/1.5 system-ui, sans-serif` | Body text, descriptions |
| `--type-label` | `500 14px/1 system-ui, sans-serif` | Standard labels, grid headers |
| `--type-label-small` | `500 12px/1 system-ui, sans-serif` | Small labels, subtitles, metadata |
| `--type-label-strong` | `700 14px/1 system-ui, sans-serif` | Emphasized labels, toolbar titles |

Consumed via the CSS `font` shorthand: `font: var(--type-label-strong);`

---

## 7. Spacing Tokens

<!-- PLACEHOLDER values below — replace with your DS spacing scale -->

| CSS Custom Property | Value | Usage |
|---|---|---|
| `--spacing-s1` | `4px` | Tight gaps, icon padding |
| `--spacing-s2` | `8px` | Internal component padding, widget border-radius |
| `--spacing-s3` | `12px` | Cell padding, chip padding, mini-grid header |
| `--spacing-s4` | `16px` | Card padding, widget padding, section gaps |
| `--spacing-s5` | `20px` | Dashboard container padding |
| `--spacing-s6` | `32px` | Section-to-section gaps |
| `--spacing-s7` | `48px` | Page-level gaps, empty state padding |
| `--spacing-s8` | `64px` | Hero spacing |

---

## 8. Grid Tokens

| CSS Custom Property | Value | Usage |
|---|---|---|
| `--grid-row-height-default` | `48px` | Standard AG Grid row height |
| `--grid-row-height-compact` | `36px` | Dense/compact mode, mini-grid rows |
| `--grid-header-height` | `52px` | Column header height |
| `--grid-toolbar-height` | `56px` | Table toolbar height |

---

## 9. Naming Convention

Token names follow the pattern: `--{category}-{group}-{variant}`

```
--color-surface-primary
  │      │       │
  │      │       └─ variant (primary, secondary, hover, etc.)
  │      └─ group (surface, border, text, brand, status)
  └─ category (color, type, spacing, grid)
```

Status color tokens use the short form (`--color-success`, not `--color-status-success`). Background variants append `-bg` (`--color-success-bg`).

---

## 10. DS Swap Instructions

When your internal design system is ready, follow these steps:

1. **Get the real token values** from your DS (Style Dictionary output, Figma Tokens export, or DS package CSS)
2. **Open `styles.scss`** and locate the `:root` block
3. **Replace each placeholder value** with the real DS value
4. **Remove `/* PLACEHOLDER */` comments** as you go
5. **Run `npx ng serve`** and visually verify one page from each persona
6. **If your DS uses different names**, add aliases in `:root`:
   ```scss
   /* DS uses --brand-600, we need --color-brand-primary */
   --color-brand-primary: var(--brand-600);
   ```
7. **Bump this spec's version** to 2.1.0 (minor — values changed, names preserved)
8. **Run the compliance checker** to verify nothing broke: `node tools/ci/spec-compliance-check.js`

---

## 11. Adding New Tokens

When you need a token that doesn't exist yet:

1. Add the CSS custom property to the `:root` block in `styles.scss`
2. Add a row to the appropriate table in this spec (§5-§8)
3. Use it in component SCSS via `var(--new-token-name)`
4. Add a changelog entry below

---

## 12. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial — Material v3 adapter (SCSS variables) | UI Architecture |
| 2.0.0 | 2026-04-08 | Rewrite — CSS custom properties, placeholder values | UI Architecture |

---

## 13. Related Specs

- `ds/components/component-map` — semantic component names
- `ds/patterns/dashboard` — dashboard pattern (references these tokens)
- `ds/patterns/ag-grid-datatable` — grid pattern (references these tokens)
