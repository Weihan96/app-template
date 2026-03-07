#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const skillsWipDir = path.join(rootDir, "skills-wip");

const requiredSections = [
  "Acceptance Criteria",
  "Verification Checklist",
  "Known Couplings",
  "Install Notes",
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: null, body: raw };
  }

  const frontmatter = {};

  for (const line of match[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body: raw.slice(match[0].length) };
}

function extractSection(body, heading) {
  const sectionPattern = new RegExp(
    `^##\\s+${escapeRegExp(heading)}\\s*$([\\s\\S]*?)(?=^##\\s+|\\Z)`,
    "im",
  );
  const match = body.match(sectionPattern);
  return match ? match[1] : "";
}

function hasHeading(body, heading) {
  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`, "im");
  return headingPattern.test(body);
}

function hasStep0BeforeWorkflow(body) {
  const step0Index = body.search(/^##\s+Step 0\b/im);
  const workflowIndex = body.search(/^##\s+Workflow\b/im);

  if (workflowIndex === -1) {
    return true;
  }

  return step0Index !== -1 && step0Index < workflowIndex;
}

function needsCompatibilityField(step0Section) {
  return /(command -v|install|bunx|brew|apt|choco|playwright|prisma)/i.test(
    step0Section,
  );
}

async function getSkillDirectories() {
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

async function validateSkill(skillName) {
  const errors = [];
  const skillDir = path.join(skillsWipDir, skillName);
  const skillFile = path.join(skillDir, "SKILL.md");

  let rawContent;

  try {
    rawContent = await fs.readFile(skillFile, "utf8");
  } catch {
    errors.push("Missing required file: SKILL.md");
    return errors;
  }

  const { frontmatter, body } = parseFrontmatter(rawContent);

  if (!frontmatter) {
    errors.push("Missing YAML frontmatter block at top of SKILL.md");
  } else {
    if (!frontmatter.name) {
      errors.push("Frontmatter field `name` is required");
    }

    if (!frontmatter.description) {
      errors.push("Frontmatter field `description` is required");
    }
  }

  for (const section of requiredSections) {
    if (!hasHeading(body, section)) {
      errors.push(`Missing required section heading: ## ${section}`);
    }
  }

  if (!hasStep0BeforeWorkflow(body)) {
    errors.push("`## Step 0` must exist and appear before `## Workflow`");
  }

  const step0Section = extractSection(body, "Step 0");
  if (step0Section && needsCompatibilityField(step0Section)) {
    if (!frontmatter || !frontmatter.compatibility) {
      errors.push(
        "Detected dependency checks/install instructions in Step 0; add frontmatter field `compatibility`",
      );
    }
  }

  return errors;
}

async function main() {
  const skillDirectories = await getSkillDirectories();

  if (skillDirectories.length === 0) {
    console.log(
      "No skills found in skills-wip/. Create skills-wip/<skill>/SKILL.md and run this command again.",
    );
    return;
  }

  const allErrors = [];

  for (const skillName of skillDirectories) {
    const errors = await validateSkill(skillName);
    if (errors.length > 0) {
      allErrors.push({ skillName, errors });
    }
  }

  if (allErrors.length > 0) {
    console.error("skills:validate found issues:");
    for (const issue of allErrors) {
      console.error(`- ${issue.skillName}`);
      for (const error of issue.errors) {
        console.error(`  - ${error}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `skills:validate passed (${skillDirectories.length} skill${skillDirectories.length === 1 ? "" : "s"} checked).`,
  );
}

main().catch((error) => {
  console.error("skills:validate failed with an unexpected error.");
  console.error(error);
  process.exit(1);
});
