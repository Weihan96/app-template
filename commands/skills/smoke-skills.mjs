#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ensureDir,
  formatNow,
  getSkillEntry,
  loadManifest,
  resolveArgTarget,
  resolveTargets,
  runShellCommand,
  skillDir,
  smokeTmpDir,
  writeJsonFile,
} from "./lib.mjs";

function parseOptions(argv) {
  return {
    strict: argv.includes("--strict"),
  };
}

async function loadSmokeConfig(skillName) {
  const configPath = path.join(skillDir(skillName), "smoke.json");
  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.commands)) {
      return { ok: false, reason: "smoke.json exists but `commands` is not an array." };
    }
    return { ok: true, commands: parsed.commands, configPath };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { ok: false, reason: "smoke.json not found." };
    }
    return {
      ok: false,
      reason: `Unable to read smoke.json: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function runSkillSmoke(skillName, commands) {
  const timestamp = formatNow();
  const runDir = path.join(smokeTmpDir, skillName, timestamp);
  await ensureDir(runDir);

  const results = [];
  for (let i = 0; i < commands.length; i += 1) {
    const command = commands[i];
    const executed = runShellCommand(command);
    results.push({
      index: i + 1,
      command,
      ok: executed.ok,
      code: executed.code,
      stdout: executed.stdout,
      stderr: executed.stderr,
    });

    await fs.writeFile(
      path.join(runDir, `command-${String(i + 1).padStart(2, "0")}.log`),
      `# ${command}\n\n## stdout\n${executed.stdout}\n\n## stderr\n${executed.stderr}\n`,
      "utf8",
    );
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    skillName,
    passed: results.every((result) => result.ok),
    total: results.length,
    failed: results.filter((result) => !result.ok).length,
    results,
  };
  await writeJsonFile(path.join(runDir, "summary.json"), summary);

  return { runDir, summary };
}

async function main() {
  const args = process.argv.slice(2);
  const { strict } = parseOptions(args);
  const manifest = await loadManifest();
  const targets = resolveTargets(manifest, resolveArgTarget(args));

  let failCount = 0;
  let warnCount = 0;
  let passCount = 0;

  for (const skillName of targets) {
    const entry = getSkillEntry(manifest, skillName);
    if (!entry) {
      failCount += 1;
      console.log(`[FAIL] ${skillName}: missing manifest entry`);
      continue;
    }

    const smokeConfig = await loadSmokeConfig(skillName);
    if (!smokeConfig.ok) {
      if (strict && entry.kind !== "vendor") {
        failCount += 1;
        console.log(`[FAIL] ${skillName}: ${smokeConfig.reason}`);
      } else {
        warnCount += 1;
        console.log(`[WARN] ${skillName}: ${smokeConfig.reason}`);
      }
      continue;
    }

    if (smokeConfig.commands.length === 0) {
      if (strict && entry.kind !== "vendor") {
        failCount += 1;
        console.log(`[FAIL] ${skillName}: smoke.json commands is empty`);
      } else {
        warnCount += 1;
        console.log(`[WARN] ${skillName}: smoke.json commands is empty`);
      }
      continue;
    }

    const { runDir, summary } = await runSkillSmoke(skillName, smokeConfig.commands);
    if (summary.passed) {
      passCount += 1;
      console.log(`[PASS] ${skillName}: smoke passed (${summary.total} commands). logs=${runDir}`);
    } else {
      failCount += 1;
      console.log(
        `[FAIL] ${skillName}: smoke failed (${summary.failed}/${summary.total} commands). logs=${runDir}`,
      );
    }
  }

  console.log(
    `skills:smoke summary -> checked=${targets.length}, pass=${passCount}, warn=${warnCount}, fail=${failCount}, strict=${strict}`,
  );

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("skills:smoke failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
