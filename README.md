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
bash .agents/skills/first-run-setup/scripts/bootstrap-dev-env.sh
bun install
cp .env.example .env
bun run prisma:generate
bun run dev
```

On a new machine, use `bash .agents/skills/first-run-setup/scripts/bootstrap-dev-env.sh --apply` if you want the repository to install supported prerequisites for you.

## Required checks

```bash
bun run lint
bun run typecheck
bun run test:skills
bun run test:e2e
```

See `AGENTS.md` and `docs/testing-criteria.md` for AI execution constraints.
