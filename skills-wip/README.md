# skills-wip

`skills-wip/` is the only source directory for developing repository skills.
Do not edit `.agents/skills` directly.

## Lifecycle

1. Create or update a skill under `skills-wip/<skill-name>/`.
2. Run `bun run skills:validate`.
3. Review changes with `git diff`.
4. Install into runtime discovery directory:

```bash
bun run skills:install -- <skill|all>
```

`.agents/skills` remains the Codex runtime/discovery location.
Changes under `skills-wip/` do not take effect until installation succeeds.

## Notes

- Install is copy-only and never deletes extra files in `.agents/skills`.
- If a target file already exists with different content, install aborts and prints a conflict list.
- After resolving conflicts, run `bun run skills:install -- <skill|all>` again.
