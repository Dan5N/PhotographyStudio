import { test, expect } from "@playwright/test";

test("manager can sign in and see real studio records", async ({ page }) => {
  const password = process.env.DEMO_PASSWORD;
  if (!password) throw new Error("Set DEMO_PASSWORD before browser tests.");
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("manager");
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/main", { timeout: 30000 });
  await expect(page.getByRole("heading", { name: "Photography Studio" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Customers", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Customers", exact: true }).click();
  await expect(page.getByText("Alex Chen", { exact: false })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "test-results/studio-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/studio-mobile.png", fullPage: true });
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});

test("anonymous direct file request is rejected", async ({ request }) => {
  const response = await request.get("/api/files/unknown");
  expect(response.status()).toBe(401);
});

test("anonymous image upload is rejected before parsing the payload", async ({ request }) => {
  const response = await request.post("/api/uploads", { multipart: { target: "unknown", kind: "original" } });
  expect(response.status()).toBe(401);
});

test("authenticated image upload rejects an invalid request origin", async ({ page }) => {
  const password = process.env.DEMO_PASSWORD;
  if (!password) throw new Error("Set DEMO_PASSWORD before browser tests.");
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("manager");
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/main", { timeout: 30000 });
  const response = await page.request.post("/api/uploads", {
    headers: { origin: "https://invalid.example" },
    multipart: { target: "unknown", kind: "original" },
  });
  expect(response.status()).toBe(403);
});