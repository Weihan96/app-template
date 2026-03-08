#!/usr/bin/env node

import path from "node:path";
import {
  listFilesRecursive,
  loadManifest,
  pathExists,
  resolveArgTarget,
  resolveTargets,
  runtimeSkillDir,
  sameFileContent,
  skillDir,
} from "./lib.mjs";

async function main() {
  const args = process.argv.slice(2);
  const manifest = await loadManifest();
  const targets = resolveTargets(manifest, resolveArgTarget(args));

  let failCount = 0;
  let passCount = 0;

  for (const skillName of targets) {
    const sourceDir = skillDir(skillName);
    const runtimeDir = runtimeSkillDir(skillName);
    const runtimeSkillFile = path.join(runtimeDir, "SKILL.md");

    if (!(await pathExists(runtimeSkillFile))) {
      failCount += 1;
      console.log(`[FAIL] ${skillName}: runtime SKILL.md missing at .agents/skills/${skillName}`);
      continue;
    }

    const sourceFiles = await listFilesRecursive(sourceDir);
    let mismatch = false;

    for (const relativeFile of sourceFiles) {
      const sourceFile = path.join(sourceDir, relativeFile);
      const runtimeFile = path.join(runtimeDir, relativeFile);
      if (!(await pathExists(runtimeFile))) {
        mismatch = true;
        console.log(`[FAIL] ${skillName}: missing runtime file ${relativeFile}`);
        continue;
      }

      const same = await sameFileContent(sourceFile, runtimeFile);
      if (!same) {
        mismatch = true;
        console.log(`[FAIL] ${skillName}: runtime file differs ${relativeFile}`);
      }
    }

    if (mismatch) {
      failCount += 1;
    } else {
      passCount += 1;
      console.log(`[PASS] ${skillName}: runtime matches skills-wip source`);
    }
  }

  console.log(`skills:verify-runtime summary -> checked=${targets.length}, pass=${passCount}, fail=${failCount}`);
  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("skills:verify-runtime failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
