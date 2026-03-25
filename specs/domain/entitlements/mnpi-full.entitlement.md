# Entitlement: MNPI Full
**spec-id:** `domain/entitlements/mnpi-full`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** Compliance / UI Architecture
**last-reviewed:** 2026-03-20

---

## 1. Intent

Defines column visibility and permissions for users with full MNPI entitlement. All columns render. Granted to Compliance Viewers by role, and to front-office users by explicit compliance approval.

> **Agent instruction:** When a composition spec declares `entitlement: domain/entitlements/mnpi-full`, render all columns including those tagged `mnpi-sensitive: true` and `audit-only: true`. No suppression applies at this level.

---

## 2. All columns render at this level

| Column tag | Action |
|---|---|
| `mnpi-sensitive: true` | Render |
| `audit-only: true` | Render |
| `compliance-only: true` | Render |
| `export-restricted: true` | Column visible — export permitted if persona allows |

---

## 3. Row actions

All row actions defined in the composition spec render. Export is permitted if the persona's data access level allows it (§2 of persona spec).

---

## 4. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial | Compliance |
