---
name: "shadcn-primitive-switch"
description: "Safely switch shadcn primitives (Radix <-> Base UI) in this repository. Use when users ask to migrate primitives, convert existing components/ui to Base UI or Radix, or require guarded migration with customization audits and before/after UI comparisons."
compatibility: "Requires Bun and Playwright Chromium browser binaries. Run `bunx playwright install chromium` when missing. Uses local dev server (`bun run dev`) for capture-ui-state screenshots and text snapshots."
---


# Shadcn Primitive Switch

## Workflow

1. Run `scripts/prepare-capture-ui-state.mjs` first to confirm `capture-ui-state` can launch a browser in the current environment.
2. Run `scripts/audit-components-ui.mjs` first to classify each `components/ui/*.tsx` file.
3. Present audit results directly to the user from `.tmp/primitive-switch/audit.json`, including:
  - Current primitive per component (`currentPrimitive`).
  - Component status (`exact|minor|moderate|deep|custom_or_untracked`).
  - Migration action per component (`switch_directly|decouple_first|keep_as_is`).
4. Ask the user which primitive target to switch to (currently `base` or `radix`).
  - Discover currently supported targets with `scripts/switch-primitives.mjs --list-targets`.
5. If any component is `decouple_first`, do not switch primitives yet. Execute only decoupling changes after explicit user confirmation.
6. Before and after decoupling, run `scripts/capture-ui-state.mjs` and `scripts/compare-ui-state.mjs` to reduce behavioral drift.
7. Ask the user to confirm decoupling results after the comparison report.
8. Only after that confirmation, run `scripts/switch-primitives.mjs --to <target>` to switch primitives and regenerate `components/ui` files.
9. Capture and compare UI again after switching, and report deltas clearly, including which components stayed `keep_as_is`.

## Commands

### 0) Prepare capture prerequisites

Check whether Playwright Chromium can launch:

```bash
bunx node .agents/skills/shadcn-primitive-switch/scripts/prepare-capture-ui-state.mjs
```

Auto-install Chromium if missing:

```bash
bunx node .agents/skills/shadcn-primitive-switch/scripts/prepare-capture-ui-state.mjs --install
```

Output: `.tmp/primitive-switch/capture-readiness.json`

### 1) Audit customization depth

```bash
bunx node .agents/skills/shadcn-primitive-switch/scripts/audit-components-ui.mjs
```

Output: `.tmp/primitive-switch/audit.json` with `currentPrimitive` and `migrationAction` fields.
`migrationAction` mapping: `switch_directly` = `无需解藕`, `decouple_first` = `需要解藕`, `keep_as_is` = `保持原样`.

### 2) Capture UI state (before/after)

If server is not running, pass `--start-command "bun run dev"`.

```bash
bunx node .agents/skills/shadcn-primitive-switch/scripts/capture-ui-state.mjs --phase before --routes / --start-command "bun run dev"
bunx node .agents/skills/shadcn-primitive-switch/scripts/capture-ui-state.mjs --phase after --routes / --start-command "bun run dev"
```

### 3) Compare UI state

```bash
bunx node .agents/skills/shadcn-primitive-switch/scripts/compare-ui-state.mjs
```

Output: `.tmp/primitive-switch/compare-report.md`

### 4) Switch primitives

List supported targets:

```bash
bunx node .agents/skills/shadcn-primitive-switch/scripts/switch-primitives.mjs --list-targets
```

Base UI target:

```bash
bunx node .agents/skills/shadcn-primitive-switch/scripts/switch-primitives.mjs --to base
```

Radix target:

```bash
bunx node .agents/skills/shadcn-primitive-switch/scripts/switch-primitives.mjs --to radix
```

Notes:

- The switch script blocks by default when `deep` components are detected in the latest audit report.
- `custom_or_untracked` defaults to `keep_as_is` unless the user explicitly asks to decouple/migrate them.
- Override only with `--allow-deep` when user explicitly accepts migration risk.

## Decoupling Rules

When deep customization exists, move product-specific behavior out of primitive files before switching:

1. Keep primitive files close to upstream registry structure.
2. Move custom style variants into wrapper components under route/product folders.
3. Move business logic side effects to feature components/hooks.
4. Preserve external props API at wrapper boundaries to avoid broad call-site rewrites.
5. Re-run lint/typecheck/tests after each decoupling batch.

For reusable decoupling templates, read [references/decoupling-patterns.md](references/decoupling-patterns.md).