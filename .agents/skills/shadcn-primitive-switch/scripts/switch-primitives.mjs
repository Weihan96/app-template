#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const PRIMITIVE_DEPENDENCIES = {
  base: "@base-ui/react",
  radix: "radix-ui",
};

function parseArgs(argv) {
  const options = {
    cwd: process.cwd(),
    to: "base",
    listTargets: false,
    targetStyle: "",
    registry: "@shadcn",
    componentsJson: "components.json",
    uiDir: "components/ui",
    audit: ".tmp/primitive-switch/audit.json",
    allowDeep: false,
    prune: true,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cwd") options.cwd = argv[++i];
    else if (arg === "--to") options.to = argv[++i];
    else if (arg === "--list-targets") options.listTargets = true;
    else if (arg === "--target-style") options.targetStyle = argv[++i];
    else if (arg === "--registry") options.registry = argv[++i];
    else if (arg === "--components-json") options.componentsJson = argv[++i];
    else if (arg === "--ui-dir") options.uiDir = argv[++i];
    else if (arg === "--audit") options.audit = argv[++i];
    else if (arg === "--allow-deep") options.allowDeep = true;
    else if (arg === "--no-prune") options.prune = false;
    else if (arg === "--dry-run") options.dryRun = true;
  }

  return options;
}

function styleFor(target) {
  if (target === "base") return "base-nova";
  if (target === "radix") return "radix-nova";
  throw new Error(`Unsupported --to value: ${target}`);
}

function registryHasItem({ cwd, registry, component }) {
  const result = spawnSync(
    "bunx",
    ["shadcn@latest", "view", `${registry}/${component}`],
    {
      cwd,
      stdio: "ignore",
    }
  );

  return result.status === 0;
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function targetPrimitiveDependency(target) {
  const dependency = PRIMITIVE_DEPENDENCIES[target];
  if (!dependency) {
    throw new Error(`Unsupported primitive target for dependency pruning: ${target}`);
  }
  return dependency;
}

function findInstalledDependencies(pkgJson) {
  return new Set([
    ...Object.keys(pkgJson.dependencies || {}),
    ...Object.keys(pkgJson.devDependencies || {}),
  ]);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.listTargets) {
    console.log(Object.keys(PRIMITIVE_DEPENDENCIES).join("\n"));
    return;
  }

  const componentsJsonPath = path.join(options.cwd, options.componentsJson);
  const uiPath = path.join(options.cwd, options.uiDir);
  const packageJsonPath = path.join(options.cwd, "package.json");

  if (!fs.existsSync(componentsJsonPath)) {
    console.error(`components.json not found: ${options.componentsJson}`);
    process.exit(1);
  }

  if (!fs.existsSync(uiPath)) {
    console.error(`UI directory not found: ${options.uiDir}`);
    process.exit(1);
  }

  const auditPath = path.join(options.cwd, options.audit);
  if (!options.allowDeep && fs.existsSync(auditPath)) {
    const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
    if (audit.hasDeepCustomization) {
      console.error("Deep UI customization detected in audit report.");
      console.error("Resolve decoupling and get user confirmation first, or rerun with --allow-deep.");
      process.exit(2);
    }
  }

  const style = options.targetStyle || styleFor(options.to);
  const componentsJson = JSON.parse(fs.readFileSync(componentsJsonPath, "utf8"));
  const oldStyle = componentsJson.style;
  const originalJson = JSON.parse(JSON.stringify(componentsJson));
  componentsJson.style = style;

  const backupPath = path.join(
    options.cwd,
    ".tmp/primitive-switch",
    `components.json.backup.${Date.now()}.json`
  );
  ensureDir(backupPath);
  fs.writeFileSync(backupPath, JSON.stringify(originalJson, null, 2) + "\n", "utf8");

  if (options.dryRun) {
    console.log(`[dry-run] style: ${oldStyle} -> ${style}`);
  } else {
    fs.writeFileSync(componentsJsonPath, JSON.stringify(componentsJson, null, 2) + "\n", "utf8");
    console.log(`Updated components.json style: ${oldStyle} -> ${style}`);
  }

  const componentFiles = fs
    .readdirSync(uiPath)
    .filter((name) => name.endsWith(".tsx"))
    .map((name) => path.basename(name, ".tsx"))
    .sort((a, b) => a.localeCompare(b));

  const supported = [];
  const skipped = [];

  for (const component of componentFiles) {
    if (registryHasItem({ cwd: options.cwd, registry: options.registry, component })) {
      supported.push(component);
    } else {
      skipped.push(component);
    }
  }

  if (supported.length === 0) {
    console.error("No registry-backed UI components found to regenerate.");
    process.exit(1);
  }

  console.log(`Regenerating ${supported.length} components from ${options.registry} with style ${style}.`);
  if (skipped.length > 0) {
    console.log(`Skipped non-registry files: ${skipped.join(", ")}`);
  }

  if (options.dryRun) {
    console.log(`[dry-run] would run shadcn add for: ${supported.join(", ")}`);
  } else {
    for (const group of chunk(supported, 20)) {
      const args = ["shadcn@latest", "add", ...group.map((name) => `${options.registry}/${name}`), "-y", "-o"];
      execFileSync("bunx", args, { cwd: options.cwd, stdio: "inherit" });
    }
  }

  if (options.prune) {
    if (!fs.existsSync(packageJsonPath)) {
      console.log("Skipping primitive dependency prune: package.json not found.");
    } else {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      const installed = findInstalledDependencies(packageJson);
      const targetDep = targetPrimitiveDependency(options.to);
      const pruneCandidates = Object.values(PRIMITIVE_DEPENDENCIES).filter(
        (dependency) => dependency !== targetDep && installed.has(dependency)
      );

      if (pruneCandidates.length === 0) {
        console.log("No old primitive dependencies to prune.");
      } else if (options.dryRun) {
        console.log(`[dry-run] would prune dependencies: ${pruneCandidates.join(", ")}`);
      } else {
        execFileSync("bun", ["remove", ...pruneCandidates], { cwd: options.cwd, stdio: "inherit" });
        console.log(`Pruned old primitive dependencies: ${pruneCandidates.join(", ")}`);
      }
    }
  } else {
    console.log("Skipping primitive dependency prune (--no-prune).");
  }

  console.log("Primitive switch regeneration completed.");
}

main();
