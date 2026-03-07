# AGENTS.md

## Purpose

- This file defines execution constraints for AI agents working in this repository.
- Scope is the repository root and all tracked project files.

## Stack contract

- Package manager and task runner: Bun.
  - IMPORTANT: Always use Bun commands. If any instruction mentions `npm`, `npx`, `yarn`, or `pnpm`, translate it to the Bun equivalent instead of running it directly.
- Framework: Next.js + TypeScript.
- Styles: Tailwind CSS.
- Components: shadcn/ui.
- Data fetching: TanStack Query.
- Deploy: Vercel (`WIP`).
- DB: Neon.
- ORM: Prisma.
- Auth: BetterAuth (`WIP`).
- Monitoring: Sentry (`WIP`).
- i18n: Paraglide (`WIP`).
- CRM: Cloudinary (`WIP`).

## MCP

- [Context7 MCP](https://context7.com/): Provides up-to-date framework and library documentation context for coding tasks.
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp/): Exposes Chrome DevTools capabilities for debugging rendering, network, and runtime issues.
- [Shadcn MCP](https://ui.shadcn.com/docs/mcp): Helps discover and integrate shadcn/ui components aligned with project conventions.

## Project map

- `app`: route-level pages, layouts, and server actions.
- `components`: reusable UI components and local UI primitives.
- `lib`: shared business logic, utility helpers, and integration wrappers.
- `prisma`: schema, migrations, and database-related configuration.
- `tests`: automated test suites including Playwright and skill-related tests.
- `docs`: project documentation including testing criteria.
- `.agents/skills`: Codex-discoverable project skills.

## Delivery contract for AI output

- Keep `bun run lint` passing after every change.
- Add or update executable tests and explicit acceptance criteria for user-visible behavior changes.
- Use the repository Playwright suite first for browser verification. Use Codex browser tooling only as supplemental verification.
- Iterate on failures until acceptance criteria pass or code output stops changing.
- Do not bypass failing checks by deleting test coverage unless the requirement itself changed.

## Verification pipeline

- `bun run lint`
- `bun run typecheck`
- `bun run test:skills`
- `bun run test:e2e`

## Test ownership

- Repository Playwright tests are the source of truth for browser automation.
- Codex-provided Playwright or Chrome MCP capabilities are runtime tools, not project assets.
- A Codex browser check does not replace committed Playwright specs, config, or criteria updates.

## Skills

- Discoverable project skills live under `.agents/skills/`.
- Do not maintain discoverable skills outside `.agents/skills/`.
- Skill inventory is auto-injected by Codex at runtime. Do not maintain a static `Available skills` list in this file.
- Add or remove skills by changing files under `.agents/skills/`.

## Coding rules

- Keep modules small and composable.
- Prefer explicit typing over inference when it improves readability at boundaries.
- Avoid magic strings for navigation, status, and integration identifiers.
- Put reusable UI in `components`, shared logic in `lib`, and product-specific sections close to the route that uses them.
- For UI primitives and patterns, prefer official shadcn components from configured registries (for example `@shadcn`) before writing custom UI.
- When an equivalent registry item exists, do not keep or introduce hand-rolled "shadcn-style" look-alike components.
- Prefer composition and extension of registry components over reimplementing the same primitive behavior.
- If no official/registry component fits a requirement, document that constraint in the PR/change summary before introducing custom UI.
- When adding reusable workflows, create or update a matching skill under `.agents/skills/`.

## Definition of done

- User-facing flow works on desktop and mobile.
- Acceptance criteria are documented.
- Lint, typecheck, and smoke tests are updated with the change.

## Maintenance rules

- Keep all paths and commands in this file valid.
- Remove or update references immediately when files, scripts, or directories are renamed or deleted.
