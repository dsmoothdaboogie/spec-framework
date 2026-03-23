# Agent Integration Guide

This guide explains how to wire the spec framework into each supported AI
agent. Every integration is **additive** — it adds to your existing agent
configuration, never replaces it.

---

## Guiding principle

Each agent config file contains a clearly marked block:

```
<!-- SPEC FRAMEWORK START ... -->
[spec framework content]
<!-- SPEC FRAMEWORK END ... -->
```

Copy only that block into your existing file. Your team conventions,
personal preferences, and existing instructions stay exactly as they are.

---

## Supported agents

| Agent | Status | Config file | Spec framework block location |
|---|---|---|---|
| Devin.ai | ✅ Active | `.devin/knowledge.md` | `.devin/knowledge.md` |
| GitHub Copilot | ✅ Active | `.github/copilot-instructions.md` | `.github/copilot-instructions.md` |
| Claude | 🔜 Future | `CLAUDE.md` | `CLAUDE.md` |
| Cursor | 🔜 Future | `.cursor/rules/spec-framework.mdc` | `.cursor/rules/spec-framework.mdc` |
| Any agent | ✅ Active | `AGENTS.md` | `AGENTS.md` |

---

## Devin.ai

**If you don't have a knowledge file yet:**
Use `.devin/knowledge.md` from this repo as-is.

**If you already have a Devin knowledge file:**
1. Open `.devin/knowledge.md` from this repo
2. Copy everything between `<!-- SPEC FRAMEWORK START -->` and
   `<!-- SPEC FRAMEWORK END -->`
3. Paste into your existing knowledge file at a logical position
   (after your team context, before task-specific instructions)

**Key things Devin gets from this block:**
- How to search the registry before generating
- The required reading order for specs
- The compliance report output contract
- CLI commands to run (registry search, lint)
- Universal Angular 19 conventions

---

## GitHub Copilot

**If you don't have a copilot-instructions.md yet:**
Use `.github/copilot-instructions.md` from this repo as-is.

**If you already have one:**
1. Open `.github/copilot-instructions.md` from this repo
2. Copy everything between `<!-- SPEC FRAMEWORK START -->` and
   `<!-- SPEC FRAMEWORK END -->`
3. Paste into your existing file — recommended position is after any
   general repo context, before language-specific rules

**Slash commands:**
The spec framework slash commands are defined in `docs/copilot-commands.json`.
These are registered separately from the instructions file — they work
alongside any existing slash commands you have configured.

---

## Claude (future)

**Status:** Not currently enabled in the workplace. File is ready.

**When Claude becomes available:**
1. `CLAUDE.md` at the repo root is picked up automatically by Claude
2. No additional configuration needed if using the file as-is
3. If you already have a `CLAUDE.md`, copy the spec framework block
   and paste it in — Claude supports multiple instruction blocks
   cleanly in the same file

**Note on personal preferences:**
`CLAUDE.md` supports personal preferences (response length, tone,
formatting). Add those below the `<!-- SPEC FRAMEWORK END -->` line.
They will not conflict with the spec framework block.

---

## Cursor (future)

**Status:** Not currently enabled in the workplace. File is ready.

**When Cursor becomes available:**
Cursor supports multiple `.mdc` rule files in `.cursor/rules/`. Each
file is applied independently — there is no conflict risk.

Option A (recommended): Place `.cursor/rules/spec-framework.mdc`
as-is. It coexists with any other rule files you have.

Option B: If you prefer a single rule file, copy the content from
`.cursor/rules/spec-framework.mdc` (below the frontmatter) and
append it to your existing rule file.

---

## AGENTS.md (universal fallback)

`AGENTS.md` at the repo root is the universal entry point. Any agent
that follows the Agent-OS convention (Devin, future tools) will read
this file. It gives a condensed version of the spec framework contract
and the Angular conventions.

**If you already have an AGENTS.md:**
Copy the spec framework block and paste it in. Recommended position:
after your repo overview, before any task-specific instructions.

---

## Keeping agent files in sync

The canonical behavioral contract lives in `docs/AGENT.system-prompt.md`.
All agent integration files derive from it. When the contract changes:

1. Update `docs/AGENT.system-prompt.md`
2. Cascade the relevant changes to each agent block
3. Bump the version number in each block's header comment
4. Note the change in the spec framework changelog

Agent files do not need to be identical — each is tailored to what that
tool supports. But the core rules (scope check, token usage, output
contract, Angular conventions) should stay consistent across all of them.

---

## Version tracking

Each spec framework block includes a version comment:

```
<!-- SPEC FRAMEWORK START ─────────────────
     Version: 1.0.0
     Maintainer: UI Architecture
─────────────────────────────────────────── -->
```

If a team's agent file has an older version, they know to pull the
updated block. This is intentionally lightweight — no tooling required,
just a version number to compare.
