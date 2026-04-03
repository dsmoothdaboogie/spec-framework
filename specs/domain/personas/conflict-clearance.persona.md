# Persona: Conflict Clearance Officer
**persona-id:** `domain/personas/conflict-clearance`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** Product / UX / Legal
**last-reviewed:** 2026-04-03

---

## 1. Identity

A Conflict Clearance Officer reviews deal submissions for conflicts of interest, information barrier exceptions, and MNPI flag status. Their sole function is to review and clear (or flag) conflict submissions before a deal proceeds past the mandate stage. This is a pure review role — they observe, record decisions, and escalate. They never modify deal records.

---

## 2. Data access level

| Capability | Level |
|---|---|
| View records | All deals — conflict fields, MNPI flags, info barriers |
| Create records | No |
| Edit records | No |
| Delete records | No |
| Export data | No — conflict records are system-managed |
| Bulk actions | No |

---

## 3. MNPI entitlement baseline

Default entitlement: `deal-restricted`

Conflict Clearance Officers see conflict status, MNPI flags, and information barriers but do not see financial fee structures or revenue figures. Their view is scoped to conflict management fields only.

---

## 4. Workflow context

Primary task: Review pending conflict submissions (conflictStatus: 'Pending'), assess MNPI flag status and information barrier assignment, record clearance decisions.

Secondary tasks: Audit historical conflict decisions, spot-check Flagged deals for escalation patterns.

Key friction points to avoid:
- Any edit control rendering in the UI — even disabled — creates false affordance
- Financial data (fees, revenue, spread) appearing in the conflict view — not relevant and potentially creates confidentiality issues
- Export mechanisms — conflict records are audit trail artifacts, not exportable

---

## 5. UI expectations

| Preference | Value |
|---|---|
| Row density | standard |
| Default sort | `conflictStatus` (Pending first), then `submittedDate` ascending |
| Key actions above fold | None — read-only view |
| Pagination default | 25 |

---

## 6. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | Product / UX / Legal |

---

## 7. Related Specs

- `domain/entitlements/deal-restricted` — default entitlement
- `domain/patterns/ag-grid-datatable/conflict-clearance`
