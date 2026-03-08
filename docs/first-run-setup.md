# First Run Setup Skill

## Acceptance Criteria

1. Given a fresh contributor machine, when Codex or a teammate needs to prepare the local environment, then the repository provides a dedicated `first-run-setup` skill under `.agents/skills/`.
2. Given the setup script runs in default mode, when no `--apply` flag is passed, then it reports planned actions without attempting package installation.
3. Given `.env.example` exists and `.env` does not, when the script runs with `--apply`, then it initializes `.env` from the example file.
4. Given Bun is installed, when the script runs without `--skip-deps`, then it includes `bun install` as part of repository bootstrap.
5. Given automatic installation is not supported on the current host, when the script cannot install a missing tool, then it prints manual installation guidance for Node.js, Bun, or Git instead of failing silently.

## Verification

- `bun run lint`
- `bun run typecheck`
- `bun run skills:validate`
- `bun run skills:publish -- first-run-setup`
