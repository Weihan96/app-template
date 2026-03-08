# skills-wip

`skills-wip/` is the only source directory for developing repository skills.
Do not edit `.agents/skills` directly.

## Lifecycle

1. Create or update a skill under `skills-wip/<skill-name>/`.
2. Run:

```bash
bun run skills:validate --profile auto
bun run skills:deps --target <skill|all>
bun run skills:smoke -- <skill|all>
bun run skills:tidyup
```

3. Review changes with `git diff`.
4. Publish into runtime discovery directory:

```bash
bun run skills:publish -- <skill|all>
```

`.agents/skills` remains the Codex runtime/discovery location.
Changes under `skills-wip/` do not take effect until publish succeeds.

## Notes

- Skill metadata and states are tracked in `skills-wip/manifest.json`.
- Publish is copy-only and does not delete extra files in `.agents/skills`.
- If runtime path is protected, publish creates manual commands under `.tmp/skills/publish/`.
- After manual publish commands, run `bun run skills:verify-runtime --target <skill|all>`.
