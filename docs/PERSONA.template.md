# Persona: [Name]
**persona-id:** `domain/personas/[persona-name]`
**version:** `0.1.0`
**status:** `draft`
**layer:** `3`
**owner:** Product / UX
**last-reviewed:** YYYY-MM-DD

---

## 1. Identity

<!-- Who is this person? What is their role in the business?
     Write for both product designers and AI agents.
     2–4 sentences maximum. -->

---

## 2. Data access level

<!-- What data can this persona see, create, edit, delete?
     Be explicit. Agents use this to resolve column visibility
     and row action permissions. -->

| Capability | Level |
|---|---|
| View records | All / Own / Team |
| Create records | Yes / No |
| Edit records | All / Own / No |
| Delete records | Yes / No |
| Export data | Yes / No |
| Bulk actions | Yes / No |

---

## 3. MNPI entitlement baseline

<!-- The default entitlement level for this persona.
     Can be overridden in composition specs for elevated access. -->

Default entitlement: `restricted` | `standard` | `full`

---

## 4. Workflow context

<!-- What is this persona trying to accomplish?
     What actions are most important to them?
     What would slow them down or create friction?
     Agents use this to determine default sort, filter presets,
     and which actions to surface above the fold. -->

Primary task:
Secondary tasks:
Key friction points to avoid:

---

## 5. UI expectations

<!-- Density, defaults, cognitive load expectations -->

| Preference | Value |
|---|---|
| Row density | compact / standard / comfortable |
| Default sort | [column] [asc/desc] |
| Key actions above fold | [list] |
| Pagination default | [number] |

---

## 6. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 0.1.0 | YYYY-MM-DD | Initial draft | [Author] |
