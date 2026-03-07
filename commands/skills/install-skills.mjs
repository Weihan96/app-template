#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const skillsWipDir = path.join(rootDir, "skills-wip");
const runtimeSkillsDir = path.join(rootDir, ".agents", "skills");

function isSafeSkillName(value) {
  return /^[a-z0-9][a-z0-9-]*$/i.test(value);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listSkillsInWip() {
  try {
    const entries = await fs.readdir(skillsWipDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function sameFileContent(sourcePath, targetPath) {
  const [source, target] = await Promise.all([
    fs.readFile(sourcePath),
    fs.readFile(targetPath),
  ]);

  return source.equals(target);
}

async function collectCopyPlan(sourceDir, targetDir, relativeDir, plan, conflicts) {
  const sourceEntries = await fs.readdir(sourceDir, { withFileTypes: true });

  if (await pathExists(targetDir)) {
    const targetStat = await fs.lstat(targetDir);
    if (!targetStat.isDirectory()) {
      conflicts.push(
        `${relativeDir || "."}: source is a directory but target is a file/symlink`,
      );
      return;
    }
  }

  plan.directories.add(targetDir);

  for (const entry of sourceEntries) {
    if (entry.name === ".DS_Store") {
      continue;
    }

    const sourceEntryPath = path.join(sourceDir, entry.name);
    const targetEntryPath = path.join(targetDir, entry.name);
    const relativeEntryPath = relativeDir
      ? path.join(relativeDir, entry.name)
      : entry.name;

    if (entry.isDirectory()) {
      await collectCopyPlan(
        sourceEntryPath,
        targetEntryPath,
        relativeEntryPath,
        plan,
        conflicts,
      );
      continue;
    }

    if (!entry.isFile()) {
      conflicts.push(`${relativeEntryPath}: only regular files and directories are supported`);
      continue;
    }

    if (await pathExists(targetEntryPath)) {
      const targetStat = await fs.lstat(targetEntryPath);
      if (!targetStat.isFile()) {
        conflicts.push(
          `${relativeEntryPath}: source is a file but target is a directory/symlink`,
        );
        continue;
      }

      const sameContent = await sameFileContent(sourceEntryPath, targetEntryPath);
      if (!sameContent) {
        conflicts.push(
          `${relativeEntryPath}: target file already exists with different content`,
        );
        continue;
      }
    }

    plan.files.push({ sourcePath: sourceEntryPath, targetPath: targetEntryPath });
  }
}

function usage() {
  console.error("Usage: bun run skills:install -- <skill|all>");
}

async function parseTargets(argv) {
  const target = argv[2];

  if (!target) {
    usage();
    process.exit(1);
  }

  if (target === "all") {
    const allSkills = await listSkillsInWip();
    if (allSkills.length === 0) {
      console.error("No skills available in skills-wip/. Nothing to install.");
      process.exit(1);
    }
    return allSkills;
  }

  if (!isSafeSkillName(target)) {
    console.error(
      `Invalid skill name: ${target}. Use letters, numbers, and hyphens only.`,
    );
    process.exit(1);
  }

  return [target];
}

async function ensureSkillSource(skillName) {
  const sourceSkillDir = path.join(skillsWipDir, skillName);
  const sourceSkillFile = path.join(sourceSkillDir, "SKILL.md");

  const sourceExists = await pathExists(sourceSkillDir);
  if (!sourceExists) {
    throw new Error(`Skill not found in skills-wip/: ${skillName}`);
  }

  const sourceStat = await fs.lstat(sourceSkillDir);
  if (!sourceStat.isDirectory()) {
    throw new Error(`Not a directory in skills-wip/: ${skillName}`);
  }

  if (!(await pathExists(sourceSkillFile))) {
    throw new Error(`Missing SKILL.md in skills-wip/${skillName}`);
  }

  return sourceSkillDir;
}

async function executePlan(plan) {
  for (const directory of plan.directories) {
    await fs.mkdir(directory, { recursive: true });
  }

  for (const file of plan.files) {
    await fs.mkdir(path.dirname(file.targetPath), { recursive: true });
    await fs.copyFile(file.sourcePath, file.targetPath);
    const sourceStat = await fs.stat(file.sourcePath);
    await fs.chmod(file.targetPath, sourceStat.mode);
  }
}

async function main() {
  const targets = await parseTargets(process.argv);
  await fs.mkdir(runtimeSkillsDir, { recursive: true });

  const plan = {
    directories: new Set(),
    files: [],
  };

  const conflicts = [];

  for (const skillName of targets) {
    const sourceSkillDir = await ensureSkillSource(skillName);
    const targetSkillDir = path.join(runtimeSkillsDir, skillName);

    await collectCopyPlan(
      sourceSkillDir,
      targetSkillDir,
      skillName,
      plan,
      conflicts,
    );
  }

  if (conflicts.length > 0) {
    console.error("Install aborted because file conflicts were detected:");
    for (const conflict of conflicts) {
      console.error(`- ${conflict}`);
    }
    console.error("");
    console.error("Resolve conflicts manually (for example with git diff), then rerun:");
    console.error("  bun run skills:install -- <skill|all>");
    process.exit(1);
  }

  await executePlan(plan);

  console.log(
    `Installed ${targets.length} skill${targets.length === 1 ? "" : "s"} into .agents/skills without deleting existing extra files.`,
  );
}

main().catch((error) => {
  console.error("skills:install failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
