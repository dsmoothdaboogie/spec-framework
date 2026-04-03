# Persona: Business Execution Lead (BEL)
**persona-id:** `domain/personas/business-execution-lead`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** Product / UX
**last-reviewed:** 2026-04-03

---

## 1. Identity

A Business Execution Lead coordinates the execution of live deal transactions — tracking milestone completion, identifying blockers, and escalating stalled deals. They act as the operational backbone of the deal team, ensuring that processes (due diligence, legal review, regulatory filings) advance in parallel and on schedule. They own the deal timeline, not the deal revenue.

---

## 2. Data access level

| Capability | Level |
|---|---|
| View records | All deals in execution phase (Mandate through Pricing) |
| Create records | No |
| Edit records | Milestone and execution fields only |
| Delete records | No |
| Export data | Yes — execution status reports |
| Bulk actions | Yes — bulk escalate, export |

---

## 3. MNPI entitlement baseline

Default entitlement: `deal-full`

BELs require visibility into deal size and type for execution planning, but their primary focus is timeline and milestone data, not fee structures.

---

## 4. Workflow context

Primary task: Identify deals with stalled stage progression (high daysInStage), verify milestone completion rates, escalate deals at risk of missing close dates.

Secondary tasks: Update milestone completion records, produce execution status reports for management review.

Key friction points to avoid:
- Revenue or spread columns distracting from timeline focus
- Stage duration not immediately visible — daysInStage is the primary risk signal
- Milestone progress not shown inline — drilling into each record to check is too slow
- Expected close date not prominent

---

## 5. UI expectations

| Preference | Value |
|---|---|
| Row density | standard |
| Default sort | `daysInStage` descending (longest-stalled first) |
| Key actions above fold | Update milestones, Escalate |
| Pagination default | 50 |

---

## 6. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | Product / UX |

---

## 7. Related Specs

- `domain/entitlements/deal-full` — default entitlement
- `domain/patterns/ag-grid-datatable/business-execution-lead`
