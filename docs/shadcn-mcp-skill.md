# Shadcn MCP Skill

## Acceptance Criteria

1. Given a Codex task that asks for shadcn/ui components or blocks, when the repository skill set is loaded, then a dedicated `shadcn-mcp` skill exists under `.agents/skills/`.
2. Given Codex needs to use the official shadcn MCP integration, when the `shadcn-mcp` skill is opened, then it tells the operator to configure `~/.codex/config.toml` with `npx shadcn@latest mcp`.
3. Given shadcn MCP is used in this repository, when code is generated from the registry, then the skill requires compatibility checks against `components.json`, `app/globals.css`, and the local `@/components/ui` alias.
4. Given the MCP server is unavailable, when the skill is followed, then it provides an explicit fallback to existing local primitives or the shadcn CLI instead of blocking silently.

## Verification

- `bun run lint`
- `bun run typecheck`
- `bun run skills:validate`
- `bun run skills:publish -- shadcn-mcp`
