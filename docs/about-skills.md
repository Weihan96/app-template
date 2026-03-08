# About Skills

## Lifecycle model

- `skills-wip/` is the curation source directory.
- `.agents/skills/` is protected runtime/discovery state.
- Do not edit `.agents/skills/` directly during curation.
- Skill changes become active only after publish.

## State model

- `Draft` -> `Curating` -> `ReadyToPublish` -> `Published`.
- Temporary fallback state: `PendingPublish` when runtime publish needs manual commands.
- State is tracked in `skills-wip/manifest.json`.

## Development workflow

1. Create or update skills under `skills-wip/<skill-name>/`.
2. Validate (core + project profile):

```bash
bun run skills:validate --profile auto
```

3. Check dependencies and smoke:

```bash
bun run skills:deps
bun run skills:smoke -- <skill|all>
bun run skills:tidyup
```

4. Review source changes with:

```bash
git diff
```

5. Publish approved skills:

```bash
bun run skills:publish -- <skill|all>
```

## Install semantics

- Publish uses copy mode into `.agents/skills/` and keeps extra runtime files.
- If runtime path is protected, publish generates one-shot manual commands in `.tmp/skills/publish/`.
- After manual publish, run:

```bash
bun run skills:verify-runtime --target <skill|all>
```

## CI and testing boundaries

- CI and verification pipeline focus on business logic (`lint`, `typecheck`, `test:e2e`).
- Skill quality is validated by curation workflow checks (`validate/deps/smoke/tidyup/publish/verify-runtime`).

## Authoring baseline

- Keep official compatibility in core rules and local enhancements in project rules.
- Use `skills-wip/AGENTS.override.md` for skill-specific prompt constraints.
- Add new curation workflows under `skills-wip/curate-skills/`.
