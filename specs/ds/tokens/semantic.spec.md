# Token Spec: Semantic Design Tokens
**spec-id:** `ds/tokens/semantic`
**version:** `1.0.0`
**status:** `active`
**owner:** UI Architecture
**last-reviewed:** 2026-03-20
**adapter:** `material-v3` <!-- change this when swapping DS -->
**applies-to:** Angular 19+, Angular Material 17+

---

## 1. Intent

This spec is the **single swap point** between pattern specs and the underlying component library. All pattern specs reference semantic token names defined here. This file maps those names to their current Material implementation.

When your internal DS ships, only this file and `ds/components/component-map.spec.md` change. No pattern spec needs to be touched.

> **Agent instruction:** Never import Angular Material tokens or variables directly in a feature component. Always import from the semantic alias paths defined in §4. If a token you need is not listed here, raise it with UI Architecture — do not reach for Material directly.

---

## 2. How this file is used

Pattern specs reference tokens like `color.$surface-hover` or `type.$label-strong`. This file defines what those resolve to in the current adapter. The import path is always the same regardless of adapter — only the underlying value changes.

```
Pattern spec                 Token spec (this file)         Adapter output
─────────────────────────────────────────────────────────────────────────
color.$surface-hover    →    semantic alias               →  mat color / DS token
type.$label-strong      →    semantic alias               →  mat typography / DS token
spacing.$s3             →    semantic alias               →  8px / DS spacing var
```

---

## 3. Adapter declaration

The current adapter is declared in the frontmatter (`adapter: material-v3`). When switching DS:
1. Update `adapter` field to your DS name
2. Update §5–§8 mappings
3. Bump version (major if breaking, minor if additive)
4. Run `spec-lint` and registry validate

---

## 4. Import paths (always stable)

These paths never change. The files they point to change when the adapter changes.

```scss
// In any feature component SCSS — these are the only allowed imports
@use '@company/spec-tokens/color'   as color;
@use '@company/spec-tokens/type'    as type;
@use '@company/spec-tokens/spacing' as spacing;
@use '@company/spec-tokens/grid'    as grid-tokens;
@use '@company/spec-tokens/elevation' as elevation;
```

The `@company/spec-tokens/*` path is an SCSS alias that points to
`specs/ds/tokens/adapters/current/`. CI keeps a symlink:
`adapters/current → adapters/material-v3` (or your DS when ready).

---

## 5. Color tokens

| Semantic token | Material v3 equivalent | Usage |
|---|---|---|
| `color.$surface-primary` | `mat.get-theme-color($theme, surface)` | Page/card backgrounds |
| `color.$surface-secondary` | `mat.get-theme-color($theme, surface-variant)` | Subtle background, table headers |
| `color.$surface-hover` | `mat.get-theme-color($theme, surface-variant)` at 8% opacity | Row hover, list item hover |
| `color.$surface-selected` | `mat.get-theme-color($theme, secondary-container)` | Selected row, active state |
| `color.$surface-overlay` | `rgba(0,0,0,0.04)` | Scrim, overlay backgrounds |
| `color.$border-subtle` | `mat.get-theme-color($theme, outline-variant)` | Dividers, table borders |
| `color.$border-default` | `mat.get-theme-color($theme, outline)` | Input borders, card borders |
| `color.$text-primary` | `mat.get-theme-color($theme, on-surface)` | Body text, labels |
| `color.$text-secondary` | `mat.get-theme-color($theme, on-surface-variant)` | Secondary text, hints |
| `color.$text-disabled` | `mat.get-theme-color($theme, on-surface)` at 38% opacity | Disabled labels |
| `color.$text-inverse` | `mat.get-theme-color($theme, on-primary)` | Text on filled buttons |
| `color.$brand-primary` | `mat.get-theme-color($theme, primary)` | CTAs, focus rings |
| `color.$brand-container` | `mat.get-theme-color($theme, primary-container)` | Chip backgrounds, badges |
| `color.$status-success` | `mat.get-theme-color($theme, tertiary)` | Success badge, positive trend |
| `color.$status-warning` | `#F59E0B` (no Material equivalent — hardcoded until DS ships) | Warning badge |
| `color.$status-error` | `mat.get-theme-color($theme, error)` | Error badge, destructive action |
| `color.$status-info` | `mat.get-theme-color($theme, secondary)` | Info badge |

### SCSS adapter file: `adapters/material-v3/_color.scss`

```scss
@use '@angular/material' as mat;

// These variables are set at the app theme level and consumed here.
// The $theme variable is injected via a mixin — see §9.
$surface-primary:    mat.get-theme-color($theme, surface);
$surface-secondary:  mat.get-theme-color($theme, surface-variant);
$surface-hover:      rgba(mat.get-theme-color($theme, surface-variant), 0.08);
$surface-selected:   mat.get-theme-color($theme, secondary-container);
$surface-overlay:    rgba(0, 0, 0, 0.04);

$border-subtle:      mat.get-theme-color($theme, outline-variant);
$border-default:     mat.get-theme-color($theme, outline);

$text-primary:       mat.get-theme-color($theme, on-surface);
$text-secondary:     mat.get-theme-color($theme, on-surface-variant);
$text-disabled:      rgba(mat.get-theme-color($theme, on-surface), 0.38);
$text-inverse:       mat.get-theme-color($theme, on-primary);

$brand-primary:      mat.get-theme-color($theme, primary);
$brand-container:    mat.get-theme-color($theme, primary-container);

$status-success:     mat.get-theme-color($theme, tertiary);
$status-warning:     #F59E0B; // TODO: replace with DS token when available
$status-error:       mat.get-theme-color($theme, error);
$status-info:        mat.get-theme-color($theme, secondary);
```

---

## 6. Typography tokens

| Semantic token | Material typescale role | Size |
|---|---|---|
| `type.$display` | `display-large` | 57px |
| `type.$headline` | `headline-medium` | 28px |
| `type.$title-large` | `title-large` | 22px |
| `type.$title` | `title-medium` | 16px |
| `type.$label-strong` | `label-large` (bold) | 14px bold |
| `type.$label` | `label-large` | 14px |
| `type.$label-small` | `label-medium` | 12px |
| `type.$body` | `body-medium` | 14px |
| `type.$body-small` | `body-small` | 12px |
| `type.$code` | (no Material equivalent — use `'Roboto Mono', monospace, 13px`) | 13px |

### SCSS adapter file: `adapters/material-v3/_type.scss`

```scss
@use '@angular/material' as mat;

$display:      mat.get-theme-typography($theme, display-large);
$headline:     mat.get-theme-typography($theme, headline-medium);
$title-large:  mat.get-theme-typography($theme, title-large);
$title:        mat.get-theme-typography($theme, title-medium);
$label-strong: (font: mat.get-theme-typography($theme, label-large), font-weight: 700);
$label:        mat.get-theme-typography($theme, label-large);
$label-small:  mat.get-theme-typography($theme, label-medium);
$body:         mat.get-theme-typography($theme, body-medium);
$body-small:   mat.get-theme-typography($theme, body-small);
$code:         (font-family: "'Roboto Mono', monospace", font-size: 13px);
```

---

## 7. Spacing tokens

Material does not have a native spacing scale — these are defined as multiples of the Material baseline (4px).

| Semantic token | Value | Usage |
|---|---|---|
| `spacing.$s1` | 4px | Tight gaps, icon padding |
| `spacing.$s2` | 8px | Internal component padding |
| `spacing.$s3` | 12px | Cell padding, chip padding |
| `spacing.$s4` | 16px | Card padding, section gaps |
| `spacing.$s5` | 24px | Component-to-component gaps |
| `spacing.$s6` | 32px | Section-to-section gaps |
| `spacing.$s7` | 48px | Page-level gaps |
| `spacing.$s8` | 64px | Hero spacing |

### SCSS adapter file: `adapters/material-v3/_spacing.scss`

```scss
$s1: 4px;
$s2: 8px;
$s3: 12px;
$s4: 16px;
$s5: 24px;
$s6: 32px;
$s7: 48px;
$s8: 64px;
```

---

## 8. Grid-specific tokens

| Semantic token | Value | Notes |
|---|---|---|
| `grid-tokens.$row-height-default` | 48px | Standard row height |
| `grid-tokens.$row-height-compact` | 36px | Dense/compact mode |
| `grid-tokens.$header-height` | 52px | Column header height |
| `grid-tokens.$toolbar-height` | 56px | Table toolbar (matches mat-toolbar dense) |

---

## 9. Theme injection pattern

Material tokens require access to the active theme. The adapter files use a mixin pattern so the theme is injected once at the app level:

```scss
// app-theme.scss (app shell — configured once)
@use '@angular/material' as mat;
@use '@company/spec-tokens/adapters/material-v3/color' as color with ($theme: $app-theme);
@use '@company/spec-tokens/adapters/material-v3/type' as type with ($theme: $app-theme);
```

Feature components never need to know the theme exists — they just import the semantic alias.

---

## 10. DS swap checklist

When your internal DS is ready:

- [ ] Create `adapters/[ds-name]/` with `_color.scss`, `_type.scss`, `_spacing.scss`, `_grid.scss`
- [ ] Map each semantic token to the DS equivalent
- [ ] Update `adapters/current` symlink to point to `adapters/[ds-name]`
- [ ] Update `adapter` field in this spec's frontmatter
- [ ] Bump spec version (major)
- [ ] Review all `// TODO: replace with DS token` comments
- [ ] Run `spec-lint` across all pattern specs — no spec changes should be needed
- [ ] Smoke test 2–3 generated components against the new adapter

---

## 11. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial — Material v3 adapter | UI Architecture |

---

## 12. Related Specs

- `ds/components/component-map` — semantic component names → Material components
- `ds/tokens/motion` — animation/transition tokens (future)
- `ds/tokens/breakpoints` — responsive breakpoint tokens (future)
