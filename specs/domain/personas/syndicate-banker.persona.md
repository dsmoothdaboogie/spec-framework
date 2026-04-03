# Persona: Syndicate Banker
**persona-id:** `domain/personas/syndicate-banker`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** Product / UX
**last-reviewed:** 2026-04-03

---

## 1. Identity

A Syndicate Banker manages the book-building and allocation process for equity and debt capital markets transactions. Their focus is deal execution efficiency — specifically, how well the book is covered and whether allocation is on track for pricing. They work on fewer deals than Coverage Bankers (typically 3–8 live capital markets transactions) but with extreme depth on each.

---

## 2. Data access level

| Capability | Level |
|---|---|
| View records | All ECM/DCM/LevFin deals on their desk |
| Create records | No |
| Edit records | Book-building fields only (allocation, coverage) |
| Delete records | No |
| Export data | Yes — pricing summaries only |
| Bulk actions | Yes — export only |

---

## 3. MNPI entitlement baseline

Default entitlement: `deal-full`

Syndicate Bankers require full financial visibility including spread, allocation, and coverage multiple data.

---

## 4. Workflow context

Primary task: Monitor book-building coverage ratio across live deals, identify under-covered books requiring attention, track pricing date proximity.

Secondary tasks: Update book allocation figures, generate pricing summary exports for management review.

Key friction points to avoid:
- Coverage multiple not immediately visible — this is the most-watched figure
- Pricing date not prominent — missing a pricing date is a critical error
- Revenue or mandate details cluttering the book-building view

---

## 5. UI expectations

| Preference | Value |
|---|---|
| Row density | compact |
| Default sort | `pricingDate` ascending (closest to pricing first) |
| Key actions above fold | Update books, Pricing summary |
| Pagination default | 25 |

---

## 6. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | Product / UX |

---

## 7. Related Specs

- `domain/entitlements/deal-full` — default entitlement
- `domain/patterns/ag-grid-datatable/syndicate-banker`
