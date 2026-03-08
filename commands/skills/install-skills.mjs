#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

console.warn(
  "[DEPRECATED] skills:install is deprecated. Use `bun run skills:publish -- <skill|all>`.",
);

const result = spawnSync("bun", ["commands/skills/publish-skills.mjs", ...args], {
  stdio: "inherit",
  shell: false,
});

process.exit(result.status ?? 1);
