# Persona: Coverage Banker
**persona-id:** `domain/personas/coverage-banker`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** Product / UX
**last-reviewed:** 2026-04-03

---

## 1. Identity

A Coverage Banker originates and owns client relationships, sources new deal mandates, and monitors their live pipeline for revenue performance. They are commission-driven and revenue-focused — their primary concern is knowing the estimated fee on each deal, how close it is to closing, and whether any deal is stalling. They work across 15–30 live deals simultaneously and need to scan, not read.

---

## 2. Data access level

| Capability | Level |
|---|---|
| View records | Own deals + team coverage deals |
| Create records | Yes |
| Edit records | Own deals only |
| Delete records | No |
| Export data | Yes — own deals only |
| Bulk actions | Yes — advance stage, export |

---

## 3. MNPI entitlement baseline

Default entitlement: `deal-full`

All fee, spread, and revenue columns render. Coverage Bankers are the primary revenue-tracking persona and require full financial visibility.

---

## 4. Workflow context

Primary task: Scan pipeline for deals nearing close date, identify stalled deals (high daysToClose or low stage progress), verify estimated revenue on active mandates.

Secondary tasks: Advance deal stage after client meetings, add coverage notes, export deal list for client relationship reporting.

Key friction points to avoid:
- Compliance, conflict, or audit columns cluttering the primary view
- Having to drill into a record to see gross spread or estimated revenue
- Losing context when switching between deals — inline revenue figures are essential
- Pagination breaking the scanning flow on large pipelines

---

## 5. UI expectations

| Preference | Value |
|---|---|
| Row density | compact |
| Default sort | `expectedCloseDate` ascending (closest to close at top) |
| Key actions above fold | Advance stage, Add note |
| Pagination default | 50 |

---

## 6. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | Product / UX |

---

## 7. Related Specs

- `domain/entitlements/deal-full` — default entitlement
- `domain/patterns/ag-grid-datatable/coverage-banker`
