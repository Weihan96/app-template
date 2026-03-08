#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  depsTmpDir,
  ensureDir,
  formatNow,
  getSkillEntry,
  loadManifest,
  parseFrontmatter,
  resolveArgTarget,
  resolveTargets,
  runShellCommand,
  skillDir,
  writeJsonFile,
} from "./lib.mjs";

const commonCliTools = new Set([
  "bun",
  "bunx",
  "node",
  "python",
  "python3",
  "bash",
  "sh",
  "git",
  "playwright",
]);

function parseOptions(argv) {
  return {
    strict: argv.includes("--strict"),
  };
}

function extractDependencies(step0Section) {
  const deps = new Set();

  const commandVPattern = /command\s+-v\s+([A-Za-z0-9._-]+)/g;
  for (const match of step0Section.matchAll(commandVPattern)) {
    deps.add(match[1]);
  }

  const codeFencePattern = /```(?:bash|sh|zsh)?\n([\s\S]*?)```/g;
  for (const blockMatch of step0Section.matchAll(codeFencePattern)) {
    const codeBlock = blockMatch[1];
    for (const lineRaw of codeBlock.split("\n")) {
      const line = lineRaw.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }
      const [firstToken] = line.split(/\s+/);
      if (commonCliTools.has(firstToken)) {
        deps.add(firstToken);
      }
    }
  }

  return [...deps].sort((left, right) => left.localeCompare(right));
}

function extractStep0Section(body) {
  const match = body.match(/^##\s+Step 0\b[\s\S]*?(?=^##\s+|\Z)/im);
  if (!match) {
    return "";
  }

  const section = match[0].replace(/^##\s+Step 0\b[^\n]*\n?/i, "");
  return section.trim();
}

async function evaluateSkillDeps(skillName) {
  const skillFile = path.join(skillDir(skillName), "SKILL.md");
  const raw = await fs.readFile(skillFile, "utf8");
  const { body } = parseFrontmatter(raw);
  const step0 = extractStep0Section(body);

  if (!step0) {
    return {
      skillName,
      status: "warn",
      message: "No Step 0 section found; cannot infer dependencies.",
      dependencies: [],
      missing: [],
      available: [],
    };
  }

  const dependencies = extractDependencies(step0);
  const missing = [];
  const available = [];

  for (const dep of dependencies) {
    const result = runShellCommand(`command -v ${dep}`);
    if (result.ok) {
      available.push(dep);
    } else {
      missing.push(dep);
    }
  }

  const status = missing.length > 0 ? "fail" : "pass";
  const message =
    status === "pass"
      ? "Dependencies available."
      : `Missing dependencies: ${missing.join(", ")}`;

  return {
    skillName,
    status,
    message,
    dependencies,
    missing,
    available,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const { strict } = parseOptions(args);
  const manifest = await loadManifest();
  const targets = resolveTargets(manifest, resolveArgTarget(args));

  const results = [];

  for (const skillName of targets) {
    const entry = getSkillEntry(manifest, skillName);
    if (!entry) {
      results.push({
        skillName,
        status: "fail",
        message: "Missing manifest entry",
        dependencies: [],
        missing: [],
        available: [],
      });
      continue;
    }

    try {
      const result = await evaluateSkillDeps(skillName);
      results.push(result);
    } catch (error) {
      results.push({
        skillName,
        status: "fail",
        message: error instanceof Error ? error.message : String(error),
        dependencies: [],
        missing: [],
        available: [],
      });
    }
  }

  await ensureDir(depsTmpDir);
  const timestamp = formatNow();
  const report = {
    generatedAt: new Date().toISOString(),
    strict,
    targets,
    results,
  };
  const reportPath = path.join(depsTmpDir, `report-${timestamp}.json`);
  await writeJsonFile(reportPath, report);
  await writeJsonFile(path.join(depsTmpDir, "latest.json"), report);

  let failCount = 0;
  let warnCount = 0;

  for (const result of results) {
    if (result.status === "fail") {
      failCount += 1;
      console.log(`[FAIL] ${result.skillName}: ${result.message}`);
    } else if (result.status === "warn") {
      warnCount += 1;
      console.log(`[WARN] ${result.skillName}: ${result.message}`);
    } else {
      console.log(`[PASS] ${result.skillName}: ${result.message}`);
    }
  }

  console.log(
    `skills:deps summary -> checked=${results.length}, fail=${failCount}, warn=${warnCount}, strict=${strict}, report=${reportPath}`,
  );

  if (strict && failCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("skills:deps failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
