import { expect, test } from "@playwright/test";

test("landing page renders primary hero and sidebar content", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Launch products on a stack that already matches your workflow."
    })
  ).toBeVisible();

  await expect(page.getByText("AI-first SaaS template")).toBeVisible();
  await expect(page.getByText("Sidebar-driven workspace")).toBeVisible();
  await expect(page.getByText("Neon + Prisma")).toBeVisible();
});

test("core calls to action remain available", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Start building" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Review criteria" })).toBeVisible();
});
