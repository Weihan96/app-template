#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const options = {
    cwd: process.cwd(),
    uiDir: "components/ui",
    componentsJson: "components.json",
    registry: "@shadcn",
    out: ".tmp/primitive-switch/audit.json",
    deepThreshold: 0.65,
    minorThreshold: 0.85,
    failOnDeep: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cwd") options.cwd = argv[++i];
    else if (arg === "--ui-dir") options.uiDir = argv[++i];
    else if (arg === "--components-json") options.componentsJson = argv[++i];
    else if (arg === "--registry") options.registry = argv[++i];
    else if (arg === "--out") options.out = argv[++i];
    else if (arg === "--deep-threshold") options.deepThreshold = Number(argv[++i]);
    else if (arg === "--minor-threshold") options.minorThreshold = Number(argv[++i]);
    else if (arg === "--fail-on-deep") options.failOnDeep = true;
  }

  return options;
}

function compact(source) {
  return source.replace(/\r\n/g, "\n").replace(/\s+/g, "").trim();
}

function lineTokens(source) {
  return source
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function diceSimilarity(aLines, bLines) {
  const aSet = new Set(aLines);
  const bSet = new Set(bLines);

  if (aSet.size === 0 && bSet.size === 0) return 1;

  let intersection = 0;
  for (const item of aSet) {
    if (bSet.has(item)) intersection += 1;
  }

  return (2 * intersection) / (aSet.size + bSet.size);
}

function parseViewJson(rawOutput) {
  const jsonStart = rawOutput.indexOf("[");
  if (jsonStart < 0) {
    throw new Error("Unexpected shadcn view output: JSON payload not found.");
  }

  return JSON.parse(rawOutput.slice(jsonStart));
}

function loadRegistryContent({ cwd, registry, componentName }) {
  const cacheDir = path.join(cwd, ".tmp/primitive-switch/.registry-cache");
  fs.mkdirSync(cacheDir, { recursive: true });
  const outputPath = path.join(cacheDir, `${componentName}.json`);

  const fd = fs.openSync(outputPath, "w");
  const result = spawnSync(
    "bunx",
    ["shadcn@latest", "view", `${registry}/${componentName}`],
    {
      cwd,
      stdio: ["ignore", fd, "pipe"],
    }
  );
  fs.closeSync(fd);

  if (result.status !== 0) {
    const err = result.stderr?.toString("utf8") || "Unknown shadcn view error.";
    throw new Error(err.trim());
  }

  const output = fs.readFileSync(outputPath, "utf8");
  const payload = parseViewJson(output);
  const item = payload[0];
  if (!item || !Array.isArray(item.files) || item.files.length === 0) {
    throw new Error("Registry item has no file content.");
  }

  const preferred = item.files.find((entry) =>
    entry.path.endsWith(`/ui/${componentName}.tsx`)
  );

  return (preferred ?? item.files[0]).content;
}

function classify(similarity, exact, deepThreshold, minorThreshold) {
  if (exact) return "exact";
  if (similarity >= minorThreshold) return "minor";
  if (similarity >= deepThreshold) return "moderate";
  return "deep";
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function detectPrimitiveFromSource(source) {
  if (source.includes("@base-ui/react")) return "base";
  if (source.includes("radix-ui") || source.includes("@radix-ui/")) return "radix";
  return "unknown";
}

function migrationActionForStatus(status) {
  if (status === "deep") return "decouple_first";
  if (status === "custom_or_untracked") return "keep_as_is";
  return "switch_directly";
}

function primitiveFromStyle(style) {
  if (typeof style !== "string") return "unknown";
  if (style.startsWith("base")) return "base";
  if (style.startsWith("radix")) return "radix";
  return "unknown";
}

function countBy(items, key) {
  const summary = {};
  for (const item of items) {
    const value = item[key];
    summary[value] = (summary[value] ?? 0) + 1;
  }
  return summary;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const uiPath = path.join(options.cwd, options.uiDir);
  const componentsJsonPath = path.join(options.cwd, options.componentsJson);

  let workspacePrimitive = "unknown";
  if (fs.existsSync(componentsJsonPath)) {
    try {
      const componentsJson = JSON.parse(fs.readFileSync(componentsJsonPath, "utf8"));
      workspacePrimitive = primitiveFromStyle(componentsJson.style);
    } catch {
      workspacePrimitive = "unknown";
    }
  }

  if (!fs.existsSync(uiPath)) {
    console.error(`UI directory not found: ${uiPath}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(uiPath)
    .filter((name) => name.endsWith(".tsx"))
    .sort((a, b) => a.localeCompare(b));

  const results = [];

  for (const fileName of files) {
    const absolutePath = path.join(uiPath, fileName);
    const componentName = path.basename(fileName, ".tsx");
    const localSource = fs.readFileSync(absolutePath, "utf8");

    try {
      const registrySource = loadRegistryContent({
        cwd: options.cwd,
        registry: options.registry,
        componentName,
      });

      const exact = compact(localSource) === compact(registrySource);
      const similarity = diceSimilarity(lineTokens(localSource), lineTokens(registrySource));
      const status = classify(
        similarity,
        exact,
        options.deepThreshold,
        options.minorThreshold
      );
      const detectedPrimitive = detectPrimitiveFromSource(localSource);

      results.push({
        component: componentName,
        file: path.join(options.uiDir, fileName),
        status,
        similarity: Number(similarity.toFixed(4)),
        currentPrimitive: detectedPrimitive === "unknown" ? workspacePrimitive : detectedPrimitive,
        migrationAction: migrationActionForStatus(status),
      });
    } catch (error) {
      const detectedPrimitive = detectPrimitiveFromSource(localSource);
      results.push({
        component: componentName,
        file: path.join(options.uiDir, fileName),
        status: "custom_or_untracked",
        similarity: null,
        currentPrimitive: detectedPrimitive === "unknown" ? workspacePrimitive : detectedPrimitive,
        migrationAction: migrationActionForStatus("custom_or_untracked"),
        note: String(error.message || error),
      });
    }
  }

  const summary = {
    total: results.length,
    exact: results.filter((item) => item.status === "exact").length,
    minor: results.filter((item) => item.status === "minor").length,
    moderate: results.filter((item) => item.status === "moderate").length,
    deep: results.filter((item) => item.status === "deep").length,
    custom_or_untracked: results.filter((item) => item.status === "custom_or_untracked").length,
  };

  const hasDeep = summary.deep > 0;
  const hasCustomOrUntracked = summary.custom_or_untracked > 0;
  const hasBlockingCustomization = summary.deep > 0;
  const primitiveSummary = countBy(results, "currentPrimitive");
  const migrationActionSummary = countBy(results, "migrationAction");

  const report = {
    generatedAt: new Date().toISOString(),
    cwd: options.cwd,
    uiDir: options.uiDir,
    componentsJson: options.componentsJson,
    workspacePrimitive,
    registry: options.registry,
    thresholds: {
      deep: options.deepThreshold,
      minor: options.minorThreshold,
    },
    summary,
    hasDeepCustomization: hasBlockingCustomization,
    hasBlockingCustomization,
    primitiveSummary,
    migrationActionSummary,
    results,
  };

  const outputPath = path.join(options.cwd, options.out);
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(`Audit report written: ${options.out}`);
  for (const item of results) {
    const similarity = item.similarity === null ? "n/a" : item.similarity.toFixed(2);
    console.log(
      `- ${item.component}: ${item.status} (similarity=${similarity}, primitive=${item.currentPrimitive}, action=${item.migrationAction})`
    );
  }

  if (hasDeep || hasCustomOrUntracked) {
    console.log(
      "\nCustomization review required. Decouple `deep` components first. `custom_or_untracked` defaults to keep-as-is."
    );
    if (options.failOnDeep) {
      process.exit(2);
    }
  }

  if (!hasDeep && !hasCustomOrUntracked) {
    console.log("\nNo deep customization detected. Safe to proceed with switch script.");
  }
}

main();
