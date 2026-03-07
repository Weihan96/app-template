#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

function parseArgs(argv) {
  const options = {
    cwd: process.cwd(),
    phase: null,
    baseUrl: "http://127.0.0.1:3000",
    routes: ["/"],
    outputDir: ".tmp/primitive-switch",
    startCommand: "",
    timeoutMs: 120000,
    settleMs: 1000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cwd") options.cwd = argv[++i];
    else if (arg === "--phase") options.phase = argv[++i];
    else if (arg === "--base-url") options.baseUrl = argv[++i];
    else if (arg === "--routes") options.routes = argv[++i].split(",").map((v) => v.trim()).filter(Boolean);
    else if (arg === "--output-dir") options.outputDir = argv[++i];
    else if (arg === "--start-command") options.startCommand = argv[++i];
    else if (arg === "--timeout-ms") options.timeoutMs = Number(argv[++i]);
    else if (arg === "--settle-ms") options.settleMs = Number(argv[++i]);
  }

  if (!options.phase || !["before", "after"].includes(options.phase)) {
    throw new Error("--phase is required and must be one of: before, after");
  }

  return options;
}

function slug(route) {
  if (route === "/") return "home";
  return route.replace(/^\//, "").replace(/[^a-zA-Z0-9-_]+/g, "-") || "route";
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function waitForUrl(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok || response.status >= 300) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const phaseDir = path.join(options.cwd, options.outputDir, options.phase);
  ensureDir(phaseDir);

  let server = null;
  if (options.startCommand) {
    server = spawn(options.startCommand, {
      cwd: options.cwd,
      shell: true,
      stdio: "ignore",
    });

    await waitForUrl(options.baseUrl, options.timeoutMs);
  }

  try {
    const browser = await chromium.launch();

    const viewports = [
      { name: "desktop", viewport: { width: 1440, height: 900 } },
      { name: "mobile", viewport: { width: 390, height: 844 } },
    ];

    const manifest = [];

    for (const route of options.routes) {
      const routeSlug = slug(route);
      const targetUrl = new URL(route, options.baseUrl).toString();

      for (const view of viewports) {
        const context = await browser.newContext({ viewport: view.viewport });
        const page = await context.newPage();
        await page.goto(targetUrl, { waitUntil: "networkidle" });
        await page.waitForTimeout(options.settleMs);

        const screenshotName = `${view.name}-${routeSlug}.png`;
        const textName = `${view.name}-${routeSlug}.txt`;
        const screenshotPath = path.join(phaseDir, screenshotName);
        const textPath = path.join(phaseDir, textName);

        await page.screenshot({ path: screenshotPath, fullPage: true });
        const text = await page.locator("body").innerText();
        fs.writeFileSync(textPath, `${text}\n`, "utf8");

        manifest.push({
          route,
          viewport: view.name,
          screenshot: path.relative(options.cwd, screenshotPath),
          text: path.relative(options.cwd, textPath),
        });

        await context.close();
      }
    }

    await browser.close();

    const manifestPath = path.join(phaseDir, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
    console.log(`Captured ${manifest.length} snapshots into ${path.relative(options.cwd, phaseDir)}`);
  } finally {
    if (server && !server.killed) {
      server.kill("SIGTERM");
    }
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
