# About Skills

## Lifecycle model

- `skills-wip/` is the source directory for skill development.
- `.agents/skills/` is the runtime/discovery directory used by Codex.
- Do not treat skill instructions as CI test assets.
- Skill changes become active only after installation from `skills-wip/` to `.agents/skills/`.

## Development workflow

1. Create or update skills under `skills-wip/<skill-name>/`.
2. Validate skill structure:

```bash
bun run skills:validate
```

3. Review source changes with:

```bash
git diff
```

4. Install approved skills:

```bash
bun run skills:install -- <skill|all>
```

## Install semantics

- Install is copy-only and does not delete extra files in `.agents/skills/`.
- If a target file exists with different content, installation must stop and print conflict details.
- Resolve conflicts manually, then rerun install.

## CI and testing boundaries

- CI and verification pipeline focus on business logic (`lint`, `typecheck`, `test:e2e`).
- Skill quality is validated through engineering workflow checks: `skills:validate`, manual review, and post-install runtime verification.

## Authoring baseline

- When adding reusable workflows, create or update a matching skill in `skills-wip/`, then install into `.agents/skills/`.
- Skill files should follow the template in `skills-wip/SKILL_TEMPLATE.md`.
