# Persona: Compliance Viewer
**persona-id:** `domain/personas/compliance-viewer`
**spec-id:** `domain/personas/compliance-viewer`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** Product / UX / Compliance
**last-reviewed:** 2026-03-20

---

## 1. Identity

A Compliance Viewer is a compliance or legal professional who monitors deal activity for regulatory adherence, information barrier compliance, and audit trail integrity. They require full visibility into the audit columns, MNPI flags, and access history that front-office users never see. Their view is read-only by design — they observe and record, they do not originate or modify.

---

## 2. Data access level

| Capability | Level |
|---|---|
| View records | All deals — full audit fields visible |
| Create records | No |
| Edit records | No |
| Delete records | No |
| Export data | No — audit trail is system-managed |
| Bulk actions | No |

---

## 3. MNPI entitlement baseline

Default entitlement: `full`

Compliance Viewers have full MNPI visibility by role definition. This is not an elevated grant — it is baseline for this persona.

---

## 4. Workflow context

Primary task: Review deal access logs, MNPI flag history, and information barrier exceptions for a given period or deal.

Secondary tasks: Spot-check deal stage progression against approval records, verify counterparty wall-crossing events.

Key friction points to avoid:
- Edit controls or action buttons rendering (even disabled) — creates confusion about read-only nature
- Missing audit timestamps or access history columns
- Any export mechanism — compliance trail must stay in system

---

## 5. UI expectations

| Preference | Value |
|---|---|
| Row density | standard |
| Default sort | `auditTimestamp` descending |
| Key actions above fold | None — read-only view |
| Pagination default | 25 |

---

## 6. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial | Product / UX / Compliance |

---

## 7. Related Specs

- `domain/entitlements/mnpi-full` — entitlement level
- `domain/patterns/ag-grid-datatable/compliance-viewer`
