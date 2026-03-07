# Testing Criteria

## Current baseline

1. The landing page renders a clear hero heading that communicates the product stack.
2. The desktop layout includes a visible sidebar with primary navigation and integrations.
3. Primary call-to-action buttons are visible without interaction.
4. The page content references the required technology choices: Next.js, React Query, Zod, Prisma, and Neon.
5. The design remains readable on narrow screens without sidebar overlap.
6. Repository workflow validation keeps skill development separated from runtime skill installation.

## Automation loop

1. Run `bun run lint`.
2. Run `bun run typecheck`.
3. Run `bun run test:e2e`.
4. Treat the committed Playwright suite as the primary browser check for acceptance.
5. If Chrome MCP or Codex browser tooling is available, replay the same user flow in Chrome after Playwright passes as a supplemental check.
6. Do not replace committed Playwright coverage with tool-only manual or agent-driven browser verification.
7. Stop only when all criteria pass or the generated code no longer changes between iterations.

## Skill engineering loop (non-CI)

1. Build or update skill sources under `skills-wip/`.
2. Run `bun run skills:validate`.
3. Review changes with `git diff`.
4. Run `bun run skills:install -- <skill|all>`.
5. Start a fresh Codex session and verify the installed skill is discoverable and usable.
