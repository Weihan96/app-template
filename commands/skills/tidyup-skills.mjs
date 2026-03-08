#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { depsTmpDir, loadManifest, smokeTmpDir, skillDir } from "./lib.mjs";

const forbiddenDirectoryNames = new Set(["test-results", "playwright-report", "smoke-results"]);
const forbiddenFileExtensions = new Set([".log", ".trace", ".har"]);

async function removeDirectoryIfExists(targetDir) {
  try {
    await fs.rm(targetDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

async function scanForPollution(baseDir, relativePrefix = "") {
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const issues = [];

  for (const entry of entries) {
    if (entry.name === ".DS_Store") {
      continue;
    }

    const absolute = path.join(baseDir, entry.name);
    const relative = relativePrefix ? path.join(relativePrefix, entry.name) : entry.name;

    if (entry.isDirectory()) {
      if (forbiddenDirectoryNames.has(entry.name)) {
        issues.push(`Forbidden artifact directory found: ${relative}`);
        continue;
      }
      issues.push(...(await scanForPollution(absolute, relative)));
      continue;
    }

    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (forbiddenFileExtensions.has(ext)) {
        issues.push(`Forbidden artifact file found: ${relative}`);
      }
    }
  }

  return issues;
}

async function main() {
  const manifest = await loadManifest();

  const removedSmoke = await removeDirectoryIfExists(smokeTmpDir);
  const removedDeps = await removeDirectoryIfExists(depsTmpDir);

  let issueCount = 0;
  for (const skill of manifest.skills) {
    const dir = skillDir(skill.name);
    try {
      const issues = await scanForPollution(dir, skill.name);
      for (const issue of issues) {
        issueCount += 1;
        console.log(`[FAIL] ${issue}`);
      }
    } catch (error) {
      issueCount += 1;
      console.log(
        `[FAIL] Unable to scan ${skill.name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log(
    `skills:tidyup summary -> removedSmoke=${removedSmoke}, removedDeps=${removedDeps}, issues=${issueCount}`,
  );

  if (issueCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("skills:tidyup failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
