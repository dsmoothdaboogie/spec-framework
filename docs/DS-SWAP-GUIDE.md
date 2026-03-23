# DS Swap Guide

When your internal Design System is ready to replace Angular Material, this is the complete process. **No pattern specs change.** Only the adapter layer changes.

---

## What the adapter layer is

```
specs/ds/tokens/adapters/
├── material-v3/           ← current adapter
│   ├── _color.scss
│   ├── _type.scss
│   ├── _spacing.scss
│   └── ag-grid/
│       └── _theme.scss
├── [your-ds-name]/        ← new adapter (you create this)
│   ├── _color.scss
│   ├── _type.scss
│   ├── _spacing.scss
│   └── ag-grid/
│       └── _theme.scss
└── current -> material-v3 ← symlink (update this to swap)
```

The symlink `adapters/current` is what all feature components resolve through. Changing it is the entire swap.

---

## Step 1 — Audit your DS tokens

Map every semantic token in `ds/tokens/semantic` to your DS equivalent. Use this table as a worksheet:

| Semantic token | Material v3 (current) | Your DS token |
|---|---|---|
| `color.$surface-primary` | `surface` | `[your token]` |
| `color.$surface-secondary` | `surface-variant` | |
| `color.$surface-hover` | `surface-variant` @ 8% | |
| `color.$surface-selected` | `secondary-container` | |
| `color.$border-subtle` | `outline-variant` | |
| `color.$border-default` | `outline` | |
| `color.$text-primary` | `on-surface` | |
| `color.$text-secondary` | `on-surface-variant` | |
| `color.$brand-primary` | `primary` | |
| `color.$status-success` | `tertiary` | |
| `color.$status-warning` | `#F59E0B` (hardcoded) | |
| `color.$status-error` | `error` | |
| ... | | |

Flag any gaps — semantic tokens that have no DS equivalent yet. These need a decision before the swap: use a hardcoded fallback, or add the token to your DS.

---

## Step 2 — Create the new adapter

```
specs/ds/tokens/adapters/[your-ds-name]/
```

Create `_color.scss`, `_type.scss`, `_spacing.scss` using your DS variables:

```scss
// adapters/[your-ds-name]/_color.scss
// Replace Material references with your DS imports
@use '@your-company/ds-tokens' as ds;

$surface-primary:    ds.$color-surface-primary;
$surface-secondary:  ds.$color-surface-secondary;
$surface-hover:      ds.$color-surface-hover;
$surface-selected:   ds.$color-surface-selected;
$surface-overlay:    ds.$color-surface-overlay;

$border-subtle:      ds.$color-border-subtle;
$border-default:     ds.$color-border-default;

$text-primary:       ds.$color-text-primary;
$text-secondary:     ds.$color-text-secondary;
$text-disabled:      ds.$color-text-disabled;
$text-inverse:       ds.$color-text-inverse;

$brand-primary:      ds.$color-brand-primary;
$brand-container:    ds.$color-brand-container;

$status-success:     ds.$color-status-success;
$status-warning:     ds.$color-status-warning;   // no more hardcoding
$status-error:       ds.$color-status-error;
$status-info:        ds.$color-status-info;
```

Also create the AG Grid theme override file:

```scss
// adapters/[your-ds-name]/ag-grid/_theme.scss
@use '../color' as color;
@use '../../../spacing' as spacing;
@use '../../../grid' as grid-tokens;

.ds-ag-theme {
  --ag-background-color: #{color.$surface-primary};
  --ag-header-background-color: #{color.$surface-secondary};
  --ag-row-hover-color: #{color.$surface-hover};
  --ag-selected-row-background-color: #{color.$surface-selected};
  --ag-border-color: #{color.$border-subtle};
  --ag-row-height: #{grid-tokens.$row-height-default};
  --ag-header-height: #{grid-tokens.$header-height};
  --ag-cell-horizontal-padding: #{spacing.$s3};
}
```

---

## Step 3 — Create the component adapter

For each DS component wrapper in `ds/components/component-map`, replace the Material implementation with your DS component.

Your DS components may already match the interface signatures — if your DS ships `DsBadgeComponent`, `DsEmptyStateComponent`, etc. with the same inputs, no code changes are needed anywhere.

If the interface is different, update the adapter implementations in:
```
specs/ds/components/adapters/[your-ds-name]/
```

---

## Step 4 — Swap the symlink

```bash
cd specs/ds/tokens/adapters
rm current
ln -s [your-ds-name] current
```

This is the actual swap. All `@company/spec-tokens/*` imports now resolve through your DS.

---

## Step 5 — Update spec metadata

In `ds/tokens/semantic.spec.md`:
- Update `adapter` frontmatter field to `[your-ds-name]`
- Bump version (major)
- Update §5–§8 tables to reflect your DS token names
- Remove all `// TODO: replace with DS token` comments

In `ds/components/component-map.spec.md`:
- Update `adapter` frontmatter field
- Update "Material implementation" column to reflect DS components
- Bump version (major)

---

## Step 6 — Update the registry

```json
{
  "specId": "ds/tokens/semantic",
  "version": "2.0.0",
  "adapter": "[your-ds-name]"
}
```

---

## Step 7 — Verify

```bash
# Run spec linter across all pattern specs
for f in specs/ds/patterns/*.spec.md; do
  node tools/linter/spec-lint.js "$f"
done

# Validate registry
node tools/registry/registry-cli.js validate
```

Generate one component using the ag-grid spec and verify it builds cleanly against your DS.

---

## What does NOT change

- Every pattern spec (`ds/patterns/*.spec.md`) — zero edits needed
- The agent system prompt
- The registry structure
- The Copilot slash commands
- Any already-generated feature component code (those get updated on their next re-generation cycle)
