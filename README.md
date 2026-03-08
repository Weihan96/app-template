# App Template

Opinionated starter for AI-assisted web development with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style primitives
- React Query
- Zod
- Prisma
- Neon Postgres

## Getting started

```bash
bun install
cp .env.example .env
bun run prisma:generate
bun run dev
```

## Required checks

```bash
bun run lint
bun run typecheck
bun run test:e2e
```

## Skill development workflow

Skills are developed in `skills-wip/` and installed into `.agents/skills`.

```bash
bun run skills:validate --profile auto
bun run skills:deps --target <skill|all>
bun run skills:smoke -- <skill|all>
bun run skills:tidyup
git diff
bun run skills:publish -- <skill|all>
```

See `AGENTS.md` and `docs/testing-criteria.md` for execution constraints.
