# Entitlement: MNPI Standard
**spec-id:** `domain/entitlements/mnpi-standard`
**version:** `1.0.0`
**status:** `active`
**layer:** `3`
**owner:** Compliance / UI Architecture
**last-reviewed:** 2026-03-20

---

## 1. Intent

Defines the column visibility and action permissions for users at the standard MNPI entitlement level. This is the default for front-office roles. MNPI-sensitive fields are suppressed.

> **Agent instruction:** When a composition spec declares `entitlement: domain/entitlements/mnpi-standard`, suppress all columns tagged `mnpi-sensitive: true` in the composition spec column table. Render nothing in their place — do not render a placeholder or disabled column.

---

## 2. Suppressed at this level

| Column tag | Action |
|---|---|
| `mnpi-sensitive: true` | Suppress entirely — do not render |
| `audit-only: true` | Suppress entirely — do not render |
| `compliance-only: true` | Suppress entirely — do not render |

---

## 3. Permitted at this level

| Column tag | Action |
|---|---|
| `mnpi-sensitive: false` (default) | Render |
| `export-restricted: true` | Column visible, export button disabled |

---

## 4. Row actions suppressed

- No export action
- No bulk export

---

## 5. Versioning & Change Log

| Version | Date | Change | Author |
|---|---|---|---|
| 1.0.0 | 2026-03-20 | Initial | Compliance |
