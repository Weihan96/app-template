#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function parseArgs(argv) {
  const options = {
    cwd: process.cwd(),
    outputDir: ".tmp/primitive-switch",
    beforeDir: "before",
    afterDir: "after",
    report: "compare-report.md",
    json: "compare-report.json",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cwd") options.cwd = argv[++i];
    else if (arg === "--output-dir") options.outputDir = argv[++i];
    else if (arg === "--before") options.beforeDir = argv[++i];
    else if (arg === "--after") options.afterDir = argv[++i];
    else if (arg === "--report") options.report = argv[++i];
    else if (arg === "--json") options.json = argv[++i];
  }

  return options;
}

function listFiles(rootDir, prefix = "") {
  const abs = path.join(rootDir, prefix);
  const entries = fs.readdirSync(abs, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      files.push(...listFiles(rootDir, path.join(prefix, entry.name)));
    } else {
      files.push(path.join(prefix, entry.name));
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function sha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const baseDir = path.join(options.cwd, options.outputDir);
  const beforeRoot = path.join(baseDir, options.beforeDir);
  const afterRoot = path.join(baseDir, options.afterDir);

  if (!fs.existsSync(beforeRoot) || !fs.existsSync(afterRoot)) {
    console.error("Both before and after directories are required.");
    process.exit(1);
  }

  const beforeFiles = listFiles(beforeRoot).filter((name) => name !== "manifest.json");
  const afterFiles = listFiles(afterRoot).filter((name) => name !== "manifest.json");

  const all = new Set([...beforeFiles, ...afterFiles]);
  const changed = [];
  const added = [];
  const removed = [];
  const unchanged = [];

  for (const relativePath of [...all].sort((a, b) => a.localeCompare(b))) {
    const beforePath = path.join(beforeRoot, relativePath);
    const afterPath = path.join(afterRoot, relativePath);
    const beforeExists = fs.existsSync(beforePath);
    const afterExists = fs.existsSync(afterPath);

    if (!beforeExists && afterExists) {
      added.push(relativePath);
      continue;
    }

    if (beforeExists && !afterExists) {
      removed.push(relativePath);
      continue;
    }

    const beforeHash = sha256(beforePath);
    const afterHash = sha256(afterPath);

    if (beforeHash === afterHash) {
      unchanged.push(relativePath);
    } else {
      changed.push(relativePath);
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    beforeDir: path.relative(options.cwd, beforeRoot),
    afterDir: path.relative(options.cwd, afterRoot),
    totals: {
      unchanged: unchanged.length,
      changed: changed.length,
      added: added.length,
      removed: removed.length,
    },
    changed,
    added,
    removed,
  };

  const reportLines = [];
  reportLines.push("# UI Comparison Report");
  reportLines.push("");
  reportLines.push(`Before: ${summary.beforeDir}`);
  reportLines.push(`After: ${summary.afterDir}`);
  reportLines.push("");
  reportLines.push(`- Unchanged: ${unchanged.length}`);
  reportLines.push(`- Changed: ${changed.length}`);
  reportLines.push(`- Added: ${added.length}`);
  reportLines.push(`- Removed: ${removed.length}`);
  reportLines.push("");

  if (changed.length > 0) {
    reportLines.push("## Changed Files");
    reportLines.push("");
    for (const file of changed) reportLines.push(`- ${file}`);
    reportLines.push("");
  }

  if (added.length > 0) {
    reportLines.push("## Added Files");
    reportLines.push("");
    for (const file of added) reportLines.push(`- ${file}`);
    reportLines.push("");
  }

  if (removed.length > 0) {
    reportLines.push("## Removed Files");
    reportLines.push("");
    for (const file of removed) reportLines.push(`- ${file}`);
    reportLines.push("");
  }

  const reportPath = path.join(baseDir, options.report);
  const jsonPath = path.join(baseDir, options.json);
  ensureDir(reportPath);
  ensureDir(jsonPath);

  fs.writeFileSync(reportPath, reportLines.join("\n") + "\n", "utf8");
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2) + "\n", "utf8");

  console.log(`Comparison report written: ${path.relative(options.cwd, reportPath)}`);

  if (changed.length > 0 || added.length > 0 || removed.length > 0) {
    console.log("Differences detected. Ask user to confirm whether differences are acceptable.");
    process.exit(3);
  }

  console.log("No differences detected.");
}

main();
