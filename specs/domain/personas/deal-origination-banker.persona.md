# Persona: Deal Origination Banker
**persona-id:** `domain/personas/deal-origination-banker`
**spec-id:** `domain/personas/deal-origination-banker`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** Product / UX
**last-reviewed:** 2026-03-20

---

## 1. Identity

A Deal Origination Banker is a front-office professional responsible for sourcing, evaluating, and progressing deal opportunities through the pipeline. They work across multiple live deals simultaneously and need fast access to deal status, counterparty information, and their own action items. Speed and density matter — they do not want to read, they want to scan and act.

---

## 2. Data access level

| Capability | Level |
|---|---|
| View records | Own deals + team deals |
| Create records | Yes |
| Edit records | Own deals only |
| Delete records | No |
| Export data | Yes — own deals only |
| Bulk actions | Yes — status updates, assignments |

---

## 3. MNPI entitlement baseline

Default entitlement: `standard`

Elevated to `full` by explicit entitlement grant. See `domain/entitlements/mnpi-full` for column additions at elevated level.

---

## 4. Workflow context

Primary task: Review deal pipeline status, identify stalled deals, take action (advance stage, reassign, add note).

Secondary tasks: Create new deal records, export deal list for client reporting.

Key friction points to avoid:
- Compliance or audit columns cluttering the primary view
- Having to drill into a record to see the current stage
- Pagination that breaks scanning flow on large pipelines

---

## 5. UI expectations

| Preference | Value |
|---|---|
| Row density | compact |
| Default sort | `lastUpdated` descending |
| Key actions above fold | Advance stage, Add note |
| Pagination default | 50 |

---

## 6. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial | Product / UX |

---

## 7. Related Specs

- `domain/entitlements/mnpi-standard` — default entitlement
- `domain/entitlements/mnpi-full` — elevated entitlement
- `domain/patterns/ag-grid-datatable/deal-origination-banker`
