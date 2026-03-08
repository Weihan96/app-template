#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

export const rootDir = process.cwd();
export const skillsWipDir = path.join(rootDir, "skills-wip");
export const runtimeSkillsDir = path.join(rootDir, ".agents", "skills");
export const skillsTmpDir = path.join(rootDir, ".tmp", "skills");
export const smokeTmpDir = path.join(skillsTmpDir, "smoke");
export const depsTmpDir = path.join(skillsTmpDir, "deps");
export const publishTmpDir = path.join(skillsTmpDir, "publish");
export const manifestPath = path.join(skillsWipDir, "manifest.json");

export const allowedFrontmatterKeys = new Set([
  "name",
  "description",
  "license",
  "allowed-tools",
  "metadata",
]);

export function formatNow() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

export async function readJsonFile(targetPath) {
  const raw = await fs.readFile(targetPath, "utf8");
  return JSON.parse(raw);
}

export async function writeJsonFile(targetPath, data) {
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function loadManifest() {
  if (!(await pathExists(manifestPath))) {
    throw new Error(
      `Missing skills manifest at ${manifestPath}. Create skills-wip/manifest.json first.`,
    );
  }

  const manifest = await readJsonFile(manifestPath);
  if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.skills)) {
    throw new Error("Invalid skills-wip/manifest.json: expected { version, skills[] }");
  }

  return manifest;
}

export async function saveManifest(manifest) {
  await writeJsonFile(manifestPath, manifest);
}

export function getSkillNamesFromManifest(manifest) {
  return manifest.skills.map((skill) => skill.name).sort((left, right) => left.localeCompare(right));
}

export function getSkillEntry(manifest, skillName) {
  return manifest.skills.find((skill) => skill.name === skillName) ?? null;
}

export function resolveTargets(manifest, rawTarget) {
  const target = rawTarget ?? "all";
  if (target === "all") {
    return getSkillNamesFromManifest(manifest);
  }

  const entry = getSkillEntry(manifest, target);
  if (!entry) {
    throw new Error(`Unknown skill in manifest: ${target}`);
  }
  return [target];
}

export function skillDir(skillName) {
  return path.join(skillsWipDir, skillName);
}

export function runtimeSkillDir(skillName) {
  return path.join(runtimeSkillsDir, skillName);
}

export function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatterText: null, topLevelKeys: [], scalarValues: {}, body: raw };
  }

  const text = match[1];
  const topLevelKeys = [];
  const scalarValues = {};

  for (const line of text.split("\n")) {
    // Top-level keys only (non-indented). Nested keys are ignored here.
    const topLevelMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!topLevelMatch) {
      continue;
    }

    const key = topLevelMatch[1];
    if (line.startsWith(" ") || line.startsWith("\t")) {
      continue;
    }

    topLevelKeys.push(key);
    let value = topLevelMatch[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    scalarValues[key] = value;
  }

  return {
    frontmatterText: text,
    topLevelKeys,
    scalarValues,
    body: raw.slice(match[0].length),
  };
}

export function extractSection(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##\\s+|\\Z)`, "im");
  const match = body.match(pattern);
  return match ? match[1].trim() : "";
}

export function hasHeading(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^##\\s+${escaped}\\s*$`, "im").test(body);
}

export function validateCoreFrontmatter({ topLevelKeys, scalarValues, frontmatterText }) {
  const errors = [];

  if (!frontmatterText) {
    errors.push("Missing YAML frontmatter block at top of SKILL.md");
    return errors;
  }

  const unexpected = topLevelKeys.filter((key) => !allowedFrontmatterKeys.has(key));
  if (unexpected.length > 0) {
    errors.push(
      `Unexpected frontmatter key(s): ${unexpected.join(", ")}. Allowed keys: ${[
        ...allowedFrontmatterKeys,
      ].join(", ")}`,
    );
  }

  const name = (scalarValues.name ?? "").trim();
  const description = (scalarValues.description ?? "").trim();

  if (!name) {
    errors.push("Missing `name` in frontmatter");
  } else {
    if (!/^[a-z0-9-]+$/.test(name)) {
      errors.push("`name` must be hyphen-case (lowercase letters, digits, hyphens)");
    }
    if (name.startsWith("-") || name.endsWith("-") || name.includes("--")) {
      errors.push("`name` cannot start/end with hyphen or contain consecutive hyphens");
    }
    if (name.length > 64) {
      errors.push("`name` exceeds 64 characters");
    }
  }

  if (!description) {
    errors.push("Missing `description` in frontmatter");
  } else {
    if (description.includes("<") || description.includes(">")) {
      errors.push("`description` cannot include angle brackets");
    }
    if (description.length > 1024) {
      errors.push("`description` exceeds 1024 characters");
    }
  }

  return errors;
}

export function resolveArgTarget(argv) {
  const targetFlagIndex = argv.findIndex((arg) => arg === "--target");
  if (targetFlagIndex !== -1 && argv[targetFlagIndex + 1]) {
    return argv[targetFlagIndex + 1];
  }

  const afterDashDashIndex = argv.findIndex((arg) => arg === "--");
  if (afterDashDashIndex !== -1 && argv[afterDashDashIndex + 1]) {
    return argv[afterDashDashIndex + 1];
  }

  // Legacy: first positional value that is not an option.
  const positional = argv.find((arg) => !arg.startsWith("-"));
  return positional ?? "all";
}

export function runShellCommand(command, cwd = rootDir) {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: "utf8",
  });

  return {
    ok: result.status === 0,
    code: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export async function listFilesRecursive(baseDir) {
  const files = [];

  async function walk(currentDir, relativePrefix) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".DS_Store") {
        continue;
      }

      const absolute = path.join(currentDir, entry.name);
      const relative = relativePrefix ? path.join(relativePrefix, entry.name) : entry.name;

      if (entry.isDirectory()) {
        await walk(absolute, relative);
      } else if (entry.isFile()) {
        files.push(relative);
      }
    }
  }

  if (await pathExists(baseDir)) {
    await walk(baseDir, "");
  }

  return files.sort((left, right) => left.localeCompare(right));
}

export async function sameFileContent(leftPath, rightPath) {
  const [left, right] = await Promise.all([fs.readFile(leftPath), fs.readFile(rightPath)]);
  return left.equals(right);
}

