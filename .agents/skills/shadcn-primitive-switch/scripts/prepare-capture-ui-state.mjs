#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "@playwright/test";

function parseArgs(argv) {
  const options = {
    cwd: process.cwd(),
    install: false,
    out: ".tmp/primitive-switch/capture-readiness.json",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cwd") options.cwd = argv[++i];
    else if (arg === "--out") options.out = argv[++i];
    else if (arg === "--install") options.install = true;
  }

  return options;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeReport(cwd, out, payload) {
  const target = path.join(cwd, out);
  ensureDir(target);
  fs.writeFileSync(target, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Readiness report written: ${out}`);
}

function installChromium(cwd) {
  console.log("Installing Playwright Chromium browser...");
  execFileSync("bunx", ["playwright", "install", "chromium"], {
    cwd,
    stdio: "inherit",
  });
}

async function canLaunchChromium() {
  const browser = await chromium.launch();
  await browser.close();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();

  try {
    await canLaunchChromium();

    writeReport(options.cwd, options.out, {
      generatedAt: new Date().toISOString(),
      startedAt,
      status: "ready",
      installed: false,
      message: "Playwright Chromium can launch. capture-ui-state is ready.",
    });

    console.log("Capture preflight passed.");
    return;
  } catch (firstError) {
    if (!options.install) {
      writeReport(options.cwd, options.out, {
        generatedAt: new Date().toISOString(),
        startedAt,
        status: "not-ready",
        installed: false,
        message: "Chromium launch failed. Re-run with --install.",
        error: String(firstError?.message || firstError),
      });

      console.error("Capture preflight failed. Re-run with --install to auto-install Chromium.");
      process.exit(2);
    }
  }

  try {
    installChromium(options.cwd);
    await canLaunchChromium();

    writeReport(options.cwd, options.out, {
      generatedAt: new Date().toISOString(),
      startedAt,
      status: "ready",
      installed: true,
      message: "Chromium installed and launch check passed.",
    });

    console.log("Capture preflight passed after installation.");
  } catch (error) {
    writeReport(options.cwd, options.out, {
      generatedAt: new Date().toISOString(),
      startedAt,
      status: "not-ready",
      installed: true,
      message: "Chromium installation/check failed.",
      error: String(error?.message || error),
    });

    console.error("Capture preflight failed after installation.");
    process.exit(3);
  }
}

main();
