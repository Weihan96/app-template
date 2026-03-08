#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  getSkillEntry,
  hasHeading,
  loadManifest,
  parseFrontmatter,
  resolveArgTarget,
  resolveTargets,
  skillDir,
  validateCoreFrontmatter,
} from "./lib.mjs";

const projectRequiredSections = [
  "Acceptance Criteria",
  "Verification Checklist",
  "Known Couplings",
  "Install Notes",
];

function hasStep0BeforeWorkflow(body) {
  const step0Index = body.search(/^##\s+Step 0\b/im);
  const workflowIndex = body.search(/^##\s+Workflow\b/im);
  if (workflowIndex === -1) {
    return step0Index !== -1;
  }
  return step0Index !== -1 && step0Index < workflowIndex;
}

function parseOptions(argv) {
  let profile = "auto";
  let strict = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--strict") {
      strict = true;
      continue;
    }
    if (arg === "--profile" && argv[i + 1]) {
      profile = argv[i + 1];
      i += 1;
      continue;
    }
  }

  if (!["auto", "core", "project"].includes(profile)) {
    throw new Error(`Unsupported --profile value: ${profile}`);
  }

  return { profile, strict };
}

function shouldRunProjectChecks(profile) {
  return profile === "auto" || profile === "project";
}

function projectCheckSeverity(profile, strict, skillKind) {
  if (profile === "project") {
    return "error";
  }
  if (profile === "auto") {
    if (skillKind === "vendor") {
      return "warn";
    }
    return strict ? "error" : "warn";
  }
  return "skip";
}

function formatIssue(level, skillName, message) {
  return `[${level.toUpperCase()}] ${skillName}: ${message}`;
}

async function validateOneSkill({ skillName, kind, profile, strict }) {
  const issues = [];
  const skillPath = skillDir(skillName);
  const skillFilePath = path.join(skillPath, "SKILL.md");

  let raw;
  try {
    raw = await fs.readFile(skillFilePath, "utf8");
  } catch {
    issues.push({ level: "error", message: "Missing required file SKILL.md" });
    return issues;
  }

  const parsed = parseFrontmatter(raw);

  for (const message of validateCoreFrontmatter(parsed)) {
    issues.push({ level: "error", message });
  }

  if (!shouldRunProjectChecks(profile)) {
    return issues;
  }

  const severity = projectCheckSeverity(profile, strict, kind);
  if (severity === "skip") {
    return issues;
  }

  for (const section of projectRequiredSections) {
    if (!hasHeading(parsed.body, section)) {
      issues.push({
        level: severity,
        message: `Missing project section: ## ${section}`,
      });
    }
  }

  if (!hasStep0BeforeWorkflow(parsed.body)) {
    issues.push({
      level: severity,
      message: "Project rule expects `## Step 0` before `## Workflow`",
    });
  }

  return issues;
}

async function main() {
  const args = process.argv.slice(2);
  const { profile, strict } = parseOptions(args);

  const manifest = await loadManifest();
  const targets = resolveTargets(manifest, resolveArgTarget(args));

  const allIssues = [];

  for (const skillName of targets) {
    const entry = getSkillEntry(manifest, skillName);
    if (!entry) {
      allIssues.push({ level: "error", skillName, message: "Missing manifest entry" });
      continue;
    }

    const issues = await validateOneSkill({
      skillName,
      kind: entry.kind ?? "local",
      profile,
      strict,
    });
    for (const issue of issues) {
      allIssues.push({ ...issue, skillName });
    }
  }

  const errors = allIssues.filter((issue) => issue.level === "error");
  const warns = allIssues.filter((issue) => issue.level === "warn");

  if (allIssues.length > 0) {
    for (const issue of allIssues) {
      console.log(formatIssue(issue.level, issue.skillName, issue.message));
    }
  }

  console.log(
    `skills:validate summary -> checked=${targets.length}, errors=${errors.length}, warnings=${warns.length}, profile=${profile}${strict ? ", strict=true" : ""}`,
  );

  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("skills:validate failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
