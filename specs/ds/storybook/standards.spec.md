# Component Spec: Storybook Standards
**spec-id:** `ds/storybook/standards`
**version:** `1.0.0`
**status:** `active`
**layer:** `1`
**owner:** UI Architecture
**last-reviewed:** 2026-03-20
**applies-to:** Storybook 8+, Angular 19+

---

## 1. Intent

Defines the standard for Storybook stories across all DS components and feature components. Stories are living documentation — they are the visual proof that a component implements its spec correctly. Every DS component must have a story file. Feature components built from domain composition specs must have persona-specific stories.

> **Agent instruction:** When generating a component that has a corresponding spec, generate a `.stories.ts` file alongside it. The story file must carry the `@spec` header. Required stories are defined in §4. Do not generate empty or placeholder stories.

---

## 2. Scope

### In scope
- DS component stories (Layer 1)
- Feature component stories (Layer 2/3)
- Persona composition stories

### Out of scope
- E2E tests (Playwright/Cypress) — separate spec
- Visual regression testing configuration — separate spec

---

## 3. Story file structure

```typescript
// [component].component.stories.ts

/**
 * @spec    [spec-id] v[version]
 * @persona [persona-id] v[version]   (if applicable)
 * @storybook true
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { [Component] }         from './[component].component';

const meta: Meta<[Component]> = {
  title:     '[Layer]/[Category]/[ComponentName]',
  component: [Component],
  tags:      ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**Spec:** \`[spec-id]\` v[version]

[One sentence describing what this component does and when to use it.]
        `,
      },
    },
  },
  argTypes: {
    // Document every input with type, default, description
  },
};

export default meta;
type Story = StoryObj<[Component]>;
```

---

## 4. Required stories per component type

### DS component (Layer 1)

| Story name | Purpose |
|---|---|
| `Default` | Base state, all defaults |
| `Loading` | Loading state with overlay |
| `Empty` | Empty state — no data |
| `WithData` | Representative data set |
| `Playground` | All args exposed for interactive testing |

### Feature component / composition (Layer 3)

| Story name | Purpose |
|---|---|
| `[PersonaName]Default` | Base state for this persona |
| `[PersonaName]WithData` | Realistic data for this persona |
| `[PersonaName]Loading` | Loading state |
| `[PersonaName]Empty` | Empty state |
| `[PersonaName]MnpiRestricted` | At standard entitlement — MNPI cols hidden |
| `[PersonaName]MnpiFull` | At full entitlement — all cols visible (if applicable) |

---

## 5. Story title taxonomy

```
DS/Tokens/[Name]           ← Layer 1: token stories
DS/Components/[Name]       ← Layer 1: DS component stories
DS/Patterns/[Name]         ← Layer 1: pattern stories
FW/[Category]/[Name]       ← Layer 2: framework pattern stories
Domain/[Persona]/[Name]    ← Layer 3: composition stories
```

---

## 6. Args and argTypes conventions

```typescript
argTypes: {
  // Enums — always use select control
  variant: {
    control: 'select',
    options: ['success', 'warning', 'error', 'info', 'neutral'],
    description: 'Visual variant matching DS badge status semantics',
    table: { defaultValue: { summary: 'neutral' } },
  },

  // Booleans — always checkbox
  loading: {
    control: 'boolean',
    description: 'Shows loading overlay. Maps to spec §9 loading state.',
  },

  // Outputs — always action
  rowAction: { action: 'rowAction' },
  pageChange: { action: 'pageChange' },
},
```

---

## 7. Spec linkage in stories

Every story that was generated from a spec must include the spec reference in its docs description:

```typescript
parameters: {
  docs: {
    description: {
      story: `
Implements **\`[spec-id]\`** v[version].
Persona: **\`[persona-id]\`** | Entitlement: **\`[entitlement-id]\`**
      `,
    },
  },
},
```

This makes the Storybook → Spec Explorer link explicit and human-readable.

---

## 8. DS swap note

Stories import DS components. When the DS adapter changes, story imports update the same way component imports do — through the DS package path. Stories should never import Material components directly.

```typescript
// ✓ Always
import { DsBadgeComponent } from '@company/ds/display';

// ✗ Never in story files
import { MatChipModule } from '@angular/material/chips';
```

---

## 9. Agent checklist

- [ ] `@spec` header present in story file
- [ ] `title` follows taxonomy from §5
- [ ] `tags: ['autodocs']` present
- [ ] Component description includes spec reference per §7
- [ ] All required stories present per §4
- [ ] `argTypes` documented for every input
- [ ] All outputs wired as `action`
- [ ] No direct Material imports in story file

---

## 10. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial | UI Architecture |
