# Consolidated Gap Report: domain/patterns/ag-grid-datatable/coverage-banker

> **Spec reviewed:** `specs/domain/patterns/ag-grid-datatable/coverage-banker.spec.md`  
> **Spec version:** 1.0.0  
> **Review date:** 2026-04-05  
> **Agents:** product-owner · developer · qa-engineer · architect

---

## Executive Summary

The coverage-banker spec is implementable in its broad shape but has **4 critical blockers** that would cause an agent to either fail compilation, produce a compliance risk, or generate code that silently differs from user intent. The spec also fails its own linter with 10 errors while carrying `status: active` — a governance gap that undermines the entire framework's quality gate.

**Overall verdict:** Block implementation until the 4 critical issues are resolved. The framework itself needs structural changes (linter spec-type awareness, renderer contract docs, acceptance criteria template) before the next batch of persona specs is authored.

---

## Critical Blockers (must resolve before implementation)

### C1 — `ActionsCellRendererComponent` does not exist
**Raised by:** Developer · Architect · QA Engineer

The spec references `ActionsCellRendererComponent` in §2 col 12 and the §9 checklist. This component does not exist in `src/app/shared/cell-renderers/`, is not in `ds/patterns/deal-grid-calculations §5`, and the actual demo implementation omits the actions column entirely. The base pattern spec references `DsRowActionsCellRendererComponent` from `@company/ds/ag-grid` — a different name. All three remaining persona specs (`syndicate-banker`, `business-execution-lead`, `conflict-clearance`) contain the same phantom reference, making this a framework-wide blocker.

**Resolution:** Decide on the canonical name (`ActionsCellRendererComponent` or `DsRowActionsCellRendererComponent`), add it to `ds/patterns/deal-grid-calculations §5` with its import path and typed `RowAction[]` params interface, and update all four composition specs to match.

---

### C2 — Fee-sensitive columns have no compliance signoff and no entitlement fallback
**Raised by:** Product Owner · QA Engineer · Architect

`grossSpreadBps` (Col 7) and Est. Revenue (Col 8) are tagged `fee-sensitive: true`. The spec is `status: active` but no compliance signoff is recorded anywhere in the spec or its frontmatter. Additionally:
- Col 8 is missing the `revenue-sensitive: true` tag entirely — the entitlement spec (`deal-full`) uses `fee-sensitive` and `revenue-sensitive` as separate suppression axes. An agent enforcing `deal-restricted` for another persona that reuses this column definition cannot determine whether Est. Revenue should be suppressed.
- Neither this spec nor the entitlement spec defines what the grid renders if a user's runtime entitlement cannot be confirmed as `deal-full` (no degraded state, no warning banner).

**Architect → Product Owner cross-challenge:** The classification of Col 8 as `fee-sensitive` vs. `revenue-sensitive` vs. both is a business decision that must be resolved before any agent implements entitlement enforcement logic.

**Resolution:** (a) Add `compliance-signoff` to frontmatter before implementing fee-sensitive columns. (b) Tag Col 8 `revenue-sensitive: true`. (c) Define the entitlement enforcement fallback — what columns are hidden and what message is shown when entitlement cannot be confirmed.

---

### C3 — Spec fails its own linter with 10 errors while `status: active`
**Raised by:** Developer · Architect

Running `node tools/linter/spec-lint.js` on this spec exits with code 1 and reports 10 errors: missing `**applies-to:**` frontmatter, missing `## 2. Scope`, `## 3. Design System Tokens`, `## 4. Component Structure` sections, and a heading capitalisation mismatch on `## 9. Agent checklist`. The same 10 errors appear on all sibling composition specs. The root cause is a structural mismatch: the linter enforces a `ds/`-layer pattern spec schema against composition specs, which are delta specs by design and have a different required section shape.

**Architect → Developer cross-challenge:** An agent should not generate code against a spec that fails its own gate. The current governance process has no CI enforcement preventing `status: active` on a linter-failing spec.

**Resolution (immediate):** Add `**applies-to:** Angular 19+` to frontmatter; fix `## 9. Agent Checklist` capitalisation. **Resolution (framework):** Introduce `spec-type: composition` as a required frontmatter field and update the linter to apply a composition-specific ruleset that validates `## Columns`, `## Filters`, `## Row Actions`, and `## States` instead of the pattern spec sections.

---

### C4 — No acceptance criteria; two of three required states missing
**Raised by:** Product Owner · QA Engineer · Developer

The spec defines no user-facing "done" conditions. There is no way to derive a Playwright or Cypress scenario from the spec alone. Additionally, the CLAUDE.md spec reading order explicitly states "§8–9 States: Implement loading, empty, and error. All three are required." Only the empty state is defined (§8). Loading and error states are absent entirely — an agent following CLAUDE.md will look for these sections and find nothing.

**QA → Product Owner cross-challenge:** Without acceptance criteria, there is no specification-grounded way to assert whether the implemented grid is correct for a Coverage Banker's actual workflow. The QA engineer cannot write outcome assertions for bulk actions, threshold boundary rendering, or null-date fallback.

**Resolution:** Add `§ Acceptance Criteria` with at least 5 assertable user-facing scenarios. Add `§ Loading State` and `§ Error State` blocks parallel to the existing `§8 Empty State`.

---

## Major Gaps (resolve before first agent review cycle)

| # | Gap | Raised by | Resolution |
|---|-----|-----------|------------|
| M1 | `DS_CHECKBOX_COL` is referenced in §2 col 1 but has no import path in this spec. The constant is defined in the base pattern spec — an agent reading this delta spec alone cannot resolve the import. | Developer · Architect | Add inline note: "`DS_CHECKBOX_COL` — see `ds/patterns/ag-grid-datatable §5`" |
| M2 | `FeeRevenueRendererComponent` requires `dealSizeUsd` in `cellRendererParams` but §2/§7 provide no `cellRendererParams` definition. The inline revenue figure renders as `$0` without it. | Developer | Add `cellRendererParams: { dealSizeUsd: p.data.dealSizeUsd }` to the Col 7 definition in §7 |
| M3 | `DaysCountdownRendererComponent` threshold values (`warn=30, error=7`) are stated in the column table but no `cellRendererParams` code block shows the `DaysCountdownThresholds` interface. Two agents can independently produce `{ warn: 30, error: 7 }` (wrong key names) vs `{ warnDays: 30, errorDays: 7 }` (correct). | Architect · QA | Add a `cellRendererParams` code example matching the pattern in `business-execution-lead.spec.md §3`. Document `DaysCountdownThresholds` in `ds/patterns/deal-grid-calculations §5`. |
| M4 | Threshold boundary direction is unspecified: is `daysToClose === 30` in the warning band or the normal band? Is `daysToClose === 7` error or warning? A test cannot assert the boundary. | QA | Add explicit boundary language: "warn when `daysToClose ≤ 30 AND > 7`; error when `daysToClose ≤ 7`; overdue (negative) treated as error." |
| M5 | No null/undefined rendering rules for any column. `calcDaysToClose` returns `null` for withdrawn deals (`expectedCloseDate: null`). `mandateDate` is null on D006. The spec does not state what these cells render. | QA · Developer | Add a fallback rule per nullable column: e.g., "Render '—' when the backing field or calculation returns null." |
| M6 | Est. Revenue `valueFormatter` is described only as "formatted as currency." The actual implementation uses `$${v.toFixed(1)}m` / `$${(v * 1000).toFixed(0)}k` with a 1-million threshold. An agent using Angular `CurrencyPipe` produces inconsistent output alongside Col 7. | Developer · Architect | Extract formatting logic to `formatRevenueMillions(value)` in `deal-calculations.ts`, document in `ds/patterns/deal-grid-calculations §3`, reference in §7. |
| M7 | Export CSV bulk action (§5) has no data-scoping constraint. The persona spec (§2) limits export to "own deals only" but the composition spec has no corresponding guard. An agent generates an unrestricted export. | Product Owner | Annotate the export action: `scope: own-deals-only`. Specify the enforcement mechanism (pre-filter, `userContext` param). |
| M8 | `DealStageRendererComponent` is used for `dealType` (Col 4) with `variant: neutral`, but this is not documented as intentional. `DealType` values are not stages and will fall through the `STAGE_VARIANT` lookup. An agent may flag this as an error rather than a deliberate choice. | Developer · Architect | Add: "Col 4 intentionally reuses `DealStageRendererComponent` with `cellRendererParams: { variant: 'neutral' }` to render deal type as a neutral badge." |
| M9 | Row action `disabled` condition (§4) gives a bare `stage === 'Closed' \|\| stage === 'Withdrawn'` expression with no guidance on how it is wired at runtime (inside renderer, via `cellRendererParams` callback, or column-level `cellRendererParams` function). | Developer · QA | Specify: "`disabled` is evaluated inside the renderer via `params.data.stage`. Disabled state renders with `aria-disabled='true'` and reduced opacity — not hidden." |
| M10 | Row density (`compact`) and pagination default (`50`) from the persona spec (§5) are not reflected in the composition spec. An agent reading only this spec uses base-pattern defaults. | Product Owner | Add row density and pagination default to §6 citing persona §5 as the source. |
| M11 | The spec's §9 checklist item "All 8 spec sections read before generating" is inaccurate — the spec has 11 sections. An agent may stop reading at §8. | Developer | Correct to "All 11 spec sections read before generating." |
| M12 | Base pattern version (`ds/patterns/ag-grid-datatable v2.0.0`) and layer (`3`) declared in the spec title block are not present in the registry entry for this spec. Tooling cannot detect base-pattern breaking changes without reading all spec markdown files. | Architect | Add `layer` and `base-pattern` (with pinned version) to `registry.json` schema and all composition spec registry entries. |

---

## Missing Spec Sections (required across all composition specs)

| Section | Why needed | Priority |
|---------|------------|----------|
| `## Acceptance Criteria` | No user-facing "done" definition exists. Blocks QA scenario authoring and PO sign-off. | critical |
| `## Loading State` and `## Error State` | CLAUDE.md requires all three states. Only empty state defined. Agents omit or invent these two. | critical |
| `## Entitlement Enforcement Contract` | No spec defines how columns are suppressed at runtime or what happens when entitlement is indeterminate. | critical |
| `compliance-signoff` frontmatter field | Fee/revenue-sensitive columns must not be implemented without a named compliance approver. | critical |
| `## Null / Zero Value Rendering Rules` | Every nullable column needs a stated fallback. Currently absent entirely. | major |
| `## Accessibility` | No ARIA labels, keyboard navigation, or colour-alone fallback rules for any interactive element. | major |
| `**applies-to:**` frontmatter field | Missing on all composition specs; required by linter; declares Angular version constraint. | major |
| `## Excluded Columns Rationale` | Records deliberate omissions, preventing drift during spec revisions. | minor |
| `## Data Scope` | Persona constrains data to "own + team deals" but no spec defines how this filter is applied at the grid level. | minor |

---

## Long-Term Scalability Concerns

**1. Linter quality gate is permanently broken for composition specs**  
All composition specs fail the linter with 10 identical errors because the linter applies a `ds/`-layer pattern schema to delta specs. At 6 composition specs this is known but tolerated. At 25, every spec fails the linter — the gate becomes noise and the next genuinely wrong spec merges silently. **Fix:** Introduce `spec-type: composition` and a composition-specific ruleset before authoring the next batch of persona specs.

**2. Renderer param interfaces exist only in source, not in specs**  
`FeeRevenueRendererParams`, `DaysCountdownThresholds`, and `DealStageRendererParams` are TypeScript interfaces defined only in renderer source files. No spec documents them. A renderer param change (breaking change) has no spec-level signal — the registry cannot detect it. **Fix:** Add `§ Renderer param interfaces` to `ds/patterns/deal-grid-calculations` as the authoritative contract. Any interface change requires a version bump there, triggering a `requiredBy` sweep.

**3. Stage badge color map is duplicated with a cross-spec pointer**  
`syndicate-banker.spec.md` cross-references coverage-banker §2 for its color map. If the map changes, three locations must update (composition spec, sibling spec, renderer source) with no automated link. **Fix:** Make the color map a named export in `deal-calculations.ts` and the authoritative definition in `ds/patterns/deal-grid-calculations §5`.

**4. Registry `related` field has no typed edges**  
`related` cannot distinguish "depends on" from "depended on by." Blast-radius analysis requires reading every spec file. At 250 specs this is O(n). **Fix:** Extend registry schema with `dependsOn[]` and `requiredBy[]` typed arrays. This is the single highest-leverage structural change for scaling the framework.

**5. Entitlement tag vocabulary is fragmented**  
The entitlement spec defines `fee-sensitive`, `revenue-sensitive`, and `mnpi-sensitive` as three distinct axes. The composition spec only uses `fee-sensitive`. No composition spec uses `mnpi-sensitive` at all — it is unclear whether this is intentional or an audit gap. Without a tag registry enforced by the linter, this fragments as more personas and entitlement tiers are added.

**6. No performance contract at any layer**  
No spec constrains row count, data strategy (client/server-side), or render time. The current demo is 12 mock rows. If this pattern is reused for a reporting view at 5,000 rows with client-side data, no spec flags the mismatch before code generation.

---

## Recommended Framework Changes

| Change | Addresses | Priority |
|--------|-----------|----------|
| `fw/spec-authoring/composition-spec.template.md` — dedicated template for Layer 3 delta specs with correct section schema (Columns, Filters, Row/Bulk Actions, States, Acceptance Criteria) | C3, C4, all missing sections | high |
| Linter `spec-type: composition` mode with composition-specific ruleset | C3 | high |
| `ds/patterns/deal-grid-calculations §6` — renderer param interfaces as TypeScript type stubs (`FeeRevenueRendererParams`, `DaysCountdownThresholds`, `DealStageRendererParams`) | C1, M3 | high |
| Registry schema: add `specType`, `dependsOn[]`, `requiredBy[]`, `layer`, `base-pattern` fields | M12, scalability concern 4 | high |
| `compliance-signoff` frontmatter field validated by linter before `status: active` is permitted | C2 | high |
| `ds/patterns/ag-grid-datatable §` — Actions column contract with canonical renderer name, `RowAction[]` interface, `disabled` callback pattern | C1, M9 | high |
| Entitlement tag registry spec (canonical list of all column sensitivity tags with definitions and suppression mapping) | C2, scalability concern 5 | medium |
| `## Performance contract` section in all composition specs | scalability concern 6 | medium |
| CI step: block `status: active` if `spec-lint.js` exits non-zero | C3 | medium |
| New test fixtures in `deal-mock-data.ts`: `daysToClose === 30`, `daysToClose === 7`, `daysToClose < 0` (overdue), `grossSpreadBps: 0`, restricted-entitlement mock user | C4, QA gaps | medium |

---

## Cross-Role Challenge Summary

| Challenge | From | To | Outcome needed |
|-----------|------|----|----------------|
| No acceptance criteria means no testable assertions — QA cannot write scenarios for bulk actions, threshold boundaries, or null-date fallback | QA | PO | PO must add ≥5 measurable acceptance criteria before QA can produce a test plan |
| Col 8 `revenue-sensitive` classification is a business decision — architect cannot resolve the tag, only PO can confirm whether Est. Revenue is fee-sensitive, revenue-sensitive, or both | Architect | PO | PO must confirm tag classification; Compliance must sign off before implementation |
| `ActionsCellRendererComponent` doesn't exist — QA cannot write row-action acceptance tests until Developer/Architect resolves the renderer name and Layer A adds the implementation | Architect | QA + Developer | Resolve canonical renderer name and add to Layer A before any composition spec references it |
| Spec is `status: active` with 10 linter errors — Developer should not generate code against a failing spec; Architect flags this as a governance gap | Architect | Developer | Governance: CI must block `status: active` on linter failure. Immediate: fix the 10 errors before next agent generation run |

---

*Consolidated from four independent agent reviews using `docs/GAP-REPORT.template.md`. Individual role reports available on request.*
