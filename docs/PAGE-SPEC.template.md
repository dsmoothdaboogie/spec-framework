# Page Spec: [Feature] — [Persona Name]

> **This is the authoring guide for page specs (atomic design: Pages).**
> Page specs are derived documents — they extend a template spec and declare what is persona-specific.
> - For the page structure contract, see the template spec this page extends
> - For organism-level specs, use `docs/SPEC.template.md`
> - For page layout contracts, use `docs/TEMPLATE-SPEC.template.md`

**spec-id:** `feat/[feature]/[persona]`
**spec-type:** `page`
**version:** `0.1.0`
**status:** `draft` <!-- draft | active | deprecated -->
**owner:** `[Feature Team Name]`
**last-reviewed:** `YYYY-MM-DD`
**applies-to:** `Angular 19+`
**extends:** `[template spec-id]` v[version] <!-- REQUIRED — which template does this implement? -->
**layout-variant:** `[variant-name]` <!-- declared variant from the template spec §7 -->
**persona:** `[persona-identifier]`

---

## 1. Intent

<!-- 1–2 sentences. Who is this persona? What do they need from this page?
     End with the agent instruction anchor. -->

> **Agent instruction:** Read `ds/tokens/semantic`, `ds/components/component-map`, `[organism spec-ids]`, and `[template spec-id]` — in that order — before reading this spec. This spec only declares what is persona-specific. Do not re-implement anything the template or pattern specs already prescribe.

---

## 2. Scope

### In scope
<!-- What does this persona page cover? Be specific about persona context. -->

### Out of scope
<!-- What does this page NOT handle? Redirect to sibling page specs.
     Format: "[use case] → `[spec-id]` (future)" -->

---

## 3. Slot Fulfillment

<!-- For every slot defined in the template spec §6, declare fill status and implementation. -->

| Slot | Status | Implementation |
|---|---|---|
| [slot-name] | filled | `[ComponentName]` — see §3.1 |
| [slot-name] | not used | layout-variant is `[variant]` |

### 3.1 [Slot name]

<!-- Describe what the implementing component provides for this slot.
     Reference the slot contract from the template spec.
     Only describe persona-specific decisions — not what the template already prescribes. -->

---

## 4. [Persona-specific data section]

<!-- e.g. Column Definitions, Field Mappings, Data Shape -->
<!-- The template's required minimum set (if any) must be listed here but marked "from template — do not redefine".
     Persona additions are listed below the required set. -->

---

## 5. [Persona-specific interaction section]

<!-- e.g. Row Actions, Form Actions, Navigation Targets -->

---

## 6. Permissions and Routing

**Route path:** `[path]`

**Route guards:**
- `[GuardName]` — [reason]

**Route resolver:** `[ResolverName]` — [what it fetches and why]

**Permission-denied state copy:** "[exact copy string]"

---

## 7. Required States

<!-- Persona-specific copy and behaviour for each state.
     The state components themselves are prescribed by the template spec. -->

| State | Copy / Behaviour |
|---|---|
| Page loading | [behaviour] |
| Page error | [copy] with [action] |
| Permission denied | [copy from §6] |
| Empty (no data) | [exact empty state copy] |
| Empty (filters applied) | [exact filtered-empty copy] with [action] |

---

## 8. Agent Checklist

> **Before outputting generated code, verify every item below:**

**From `[template spec-id] §12` (reproduced verbatim — do not skip these):**
- [ ] [copy each checklist item from the template spec §12 here]

**[Persona name] additions:**
- [ ] [persona-specific check]
- [ ] [persona-specific check]
- [ ] Empty state copy matches §7 exactly
- [ ] Route guards match §6 exactly

---

## 9. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 0.1.0 | YYYY-MM-DD | Initial draft | [Team] |

---

## 10. Related Specs & Resources

- `[template spec-id]` — parent template (read before this spec)
- `[organism spec-id]` — primary organism
- `ds/tokens/semantic` — token adapter
- `ds/components/component-map` — component adapter
- `feat/[feature]/[sibling-persona]` — sibling page spec (future)
