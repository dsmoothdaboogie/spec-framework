# Gap Report: [Spec ID] — [Role]

> **Spec reviewed:** `specs/[path/to/spec].spec.md`  
> **Spec version:** [version from spec frontmatter]  
> **Reviewed by:** [product-owner | developer | qa-engineer | architect]  
> **Date:** [YYYY-MM-DD]

---

## Gaps Found

| # | Gap | Severity | Spec section affected | Recommendation |
|---|-----|----------|-----------------------|----------------|
| 1 | [Description of the gap] | critical / major / minor | §[n] [Section name] | [Specific, actionable fix] |
| 2 | | | | |

**Severity guide:**
- `critical` — blocks correct implementation, creates compliance risk, or would cause agents to produce dangerously wrong output
- `major` — causes inconsistency across agents or personas, or degrades correctness in a non-obvious way
- `minor` — friction, missing polish, or omission that degrades quality over time but doesn't break core behaviour

---

## Missing Spec Sections

List sections that should exist in this spec type but are absent. Reference the spec standard at `specs/fw/` if applicable.

- [ ] **[Section name]** — [Why it's needed and what it should contain]
- [ ] **[Section name]** — [Why it's needed and what it should contain]

---

## Long-Term Scalability Concerns

Issues that are tolerable at the current scale (25 specs, 4 personas) but will compound as the framework grows.

- **[Concern]:** [Description of the scaling problem and at what scale it becomes critical]
- **[Concern]:** [Description]

---

## Recommended New Spec Templates

New spec types or template sections that would close structural gaps across the framework — not just this spec.

| Recommended spec / section | Addresses gap | Priority |
|----------------------------|---------------|----------|
| [e.g., `acceptance-criteria` block in all composition specs] | [gap it closes] | high / medium / low |
| [e.g., `test-matrix.spec.md` for persona × entitlement coverage] | | |
| [e.g., `performance-contract` section in pattern specs] | | |

---

## Role-Specific Verdict

> Replace this section with the role-specific verdict block from the agent definition.
> 
> - Product Owner → Business Verdict (Approve / Approve with conditions / Block)
> - Developer → Implementation Verdict (Can an agent implement correctly on first attempt?)
> - QA Engineer → Testability Verdict (Can this spec be tested without guessing?)
> - Architect → Architecture Verdict (Framework scalability rating + Dependency Map)

---

## Cross-Role Challenges

> This section is populated when agents review each other's findings. Leave blank in the initial review.

| Challenge | From role | To role | Description |
|-----------|-----------|---------|-------------|
| [e.g., "PO acceptance criteria are not machine-testable"] | QA Engineer | Product Owner | [Detail] |
| [e.g., "Developer migration path assumes Angular 20 API not yet available"] | Architect | Developer | [Detail] |

---

*Generated using `docs/GAP-REPORT.template.md` — part of the spec-framework multi-role review process.*
