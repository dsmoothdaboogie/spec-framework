# Entitlement: Deal Full
**spec-id:** `domain/entitlements/deal-full`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** Compliance / UI Architecture
**last-reviewed:** 2026-04-03

---

## 1. Intent

Defines column visibility and action permissions for users with full deal entitlement. All deal fields render including financial fee breakdowns, spread calculations, and revenue figures. Granted to Coverage Bankers and Syndicate Bankers by role.

> **Agent instruction:** When a composition spec declares `entitlement: domain/entitlements/deal-full`, render all columns including those tagged `fee-sensitive: true` and `revenue-sensitive: true`. No suppression applies at this level.

---

## 2. All columns render at this level

| Column tag | Action |
|---|---|
| `fee-sensitive: true` | Render |
| `revenue-sensitive: true` | Render |
| `mnpi-sensitive: true` | Render |
| `export-restricted: false` | Export permitted |

---

## 3. Row actions

All row actions defined in the composition spec render. Export is permitted when the persona's data access level allows it.

---

## 4. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | Compliance / UI Architecture |

---

## 5. Related Specs

- `domain/entitlements/mnpi-full` — audit-level visibility (compliance role)
- `domain/entitlements/deal-restricted` — suppressed entitlement level
