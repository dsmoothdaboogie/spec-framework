# Entitlement: Deal Restricted
**spec-id:** `domain/entitlements/deal-restricted`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** Compliance / UI Architecture
**last-reviewed:** 2026-04-03

---

## 1. Intent

Defines the most restrictive column visibility level for users who need deal visibility without access to financial fee structure or revenue data. Applies to Conflict Clearance Officers and other read-only operational roles.

> **Agent instruction:** When a composition spec declares `entitlement: domain/entitlements/deal-restricted`, suppress all columns tagged `fee-sensitive: true` and `revenue-sensitive: true`. Render nothing in their place — do not render a placeholder or disabled column.

---

## 2. Suppressed at this level

| Column tag | Action |
|---|---|
| `fee-sensitive: true` | Suppress entirely — do not render |
| `revenue-sensitive: true` | Suppress entirely — do not render |
| `mnpi-sensitive: true` | Suppress entirely — do not render |

---

## 3. Permitted at this level

| Column tag | Action |
|---|---|
| `conflict-sensitive: true` | Render — this is the primary data for this entitlement |
| `audit-only: true` | Render if persona spec permits |

---

## 4. Row actions suppressed

- No export action
- No bulk export
- No financial data exports

---

## 5. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-04-03 | Initial | Compliance / UI Architecture |

---

## 6. Related Specs

- `domain/entitlements/deal-full` — full financial visibility
- `domain/entitlements/mnpi-standard` — MNPI-specific suppression baseline
