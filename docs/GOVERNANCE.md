# Spec Framework — Governance Guide

## Roles

| Role | Responsibility |
|---|---|
| **Spec Author** | Any developer or team who identifies a pattern needing a spec |
| **Spec Reviewer** | UI Architecture team — approves all specs before active status |
| **Spec Owner** | Named owner per spec — responsible for keeping it current |
| **Framework Maintainer** | UI Architecture — owns the meta-spec, registry, and tooling |

---

## Lifecycle

```
IDEA → DRAFT → REVIEW → ACTIVE → (DEPRECATED)
```

### DRAFT
- Anyone can create a draft spec using `SPEC.template.md`
- Run `spec-lint.js` locally — all errors must pass, warnings reviewed
- Open a PR to `main` targeting the `specs/` directory
- Add entry to `registry.json` with `status: "draft"`

### REVIEW
- PR is reviewed by UI Architecture (see CODEOWNERS)
- Review criteria:
  - Does the spec solve a real, recurring pattern problem?
  - Is scope tight enough? (Too broad = multiple specs needed)
  - Are agent instructions unambiguous?
  - Are all DS token references correct?
  - Is the agent checklist testable?
- Estimated turnaround: 3 business days

### ACTIVE
- Status set to `active` on merge
- Announced in #ui-architecture Slack channel
- Added to the internal spec index site

### DEPRECATED
- When a pattern changes significantly or is replaced
- `deprecatedBy` field must point to the successor spec
- The deprecated spec is never deleted — agents may encounter old generated code

---

## Versioning

Specs use **semantic versioning**:

| Change type | Version bump | Example |
|---|---|---|
| Typo fix, clarification | Patch | 1.0.0 → 1.0.1 |
| New optional section, new variant | Minor | 1.0.0 → 1.1.0 |
| Breaking change to structure, tokens, or required config | Major | 1.0.0 → 2.0.0 |

**Major version bumps** require:
- Migration notes in the change log
- Announcement to all spec consumers
- A 30-day deprecation window before the old version is retired

---

## Creating a new spec — step by step

```bash
# 1. Copy the template
cp docs/SPEC.template.md specs/<namespace>/<category>/<pattern-name>.spec.md

# 2. Fill in frontmatter and content
# 3. Run the linter
node tools/linter/spec-lint.js specs/<namespace>/<category>/<pattern-name>.spec.md

# 4. Add to registry
# Edit tools/registry/registry.json

# 5. Validate registry
node tools/registry/registry-cli.js validate

# 6. Open PR
```

---

## Feedback loop

When an agent produces non-compliant output against a spec:

1. Document the failure: what the agent generated vs. what the spec required
2. Identify root cause: ambiguous instruction? missing constraint? wrong scope?
3. Open a PR to the spec with the fix + a bump to the patch version
4. If the same failure recurs across multiple agents/teams → consider a major revision

This is the equivalent of `learnings.md` at the spec level.

---

## CODEOWNERS

```
specs/                    @ui-architecture
tools/                    @ui-architecture
docs/SPEC.template.md     @ui-architecture
docs/AGENT.system-prompt.md @ui-architecture
tools/registry/registry.json @ui-architecture
```

Any PR touching `specs/` requires approval from `@ui-architecture`.
