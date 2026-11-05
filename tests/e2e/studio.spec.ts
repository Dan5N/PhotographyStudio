import { randomUUID } from "node:crypto";
import { test, expect, type APIRequestContext } from "@playwright/test";
import { createTRPCProxyClient, httpLink } from "@trpc/client";
import sharp from "sharp";
import superjson from "superjson";
import { z } from "zod";
import type { AppRouter } from "../../src/server/api/root";

const adminPassword = "123456";

function studioClient(request: APIRequestContext, baseURL: string) {
  return createTRPCProxyClient<AppRouter>({
    transformer: superjson,
    links: [httpLink({
      url: `${baseURL}/api/trpc`,
      fetch: async (url, options) => {
        const response = await request.fetch(typeof url === "string" ? url : url instanceof URL ? url.href : url.url, {
          method: options?.method,
          headers: Object.fromEntries(new Headers(options?.headers).entries()),
          data: typeof options?.body === "string" ? options.body : undefined,
        });
        return new Response(new Uint8Array(await response.body()), { status: response.status(), headers: response.headers() });
      },
    })],
  });
}

async function signIn(request: APIRequestContext, username: string, password: string) {
  const csrf = z.object({ csrfToken: z.string() }).parse(await (await request.get("/api/auth/csrf")).json());
  await request.post("/api/auth/callback/credentials", {
    form: { csrfToken: csrf.csrfToken, name: username, password, json: "true" },
  });
  const session = await request.get("/api/auth/session");
  expect(z.object({ user: z.object({ id: z.string() }) }).safeParse(await session.json()).success).toBe(true);
}

test("assigned staff upload, revise and deliver exact private image bytes", async ({ playwright, baseURL }) => {
  test.skip(process.env.STUDIO_LIFECYCLE_TEST !== "1", "Requires an explicitly enabled isolated acceptance deployment.");
  test.setTimeout(120000);
  if (!baseURL) throw new Error("A test base URL is required.");
  const origin = new URL(baseURL).origin;
  const contexts: APIRequestContext[] = [];
  const context = async () => {
    const request = await playwright.request.newContext({ baseURL });
    contexts.push(request);
    return request;
  };
  try {
    const manager = await context();
    await signIn(manager, "admin", adminPassword);
    const api = studioClient(manager, baseURL);
    const suffix = randomUUID();
    const password = randomUUID();
    const staff = async (role: "PHOTOGRAPHER" | "RETOUCHER", label: string) => {
      const username = `${label}-${suffix}`;
      const account = await api.user.register.mutate({ username, password, role, email: `${username}@example.com` });
      const request = await context();
      await signIn(request, username, password);
      return { account, request, api: studioClient(request, baseURL) };
    };
    const photographer = await staff("PHOTOGRAPHER", "photographer");
    const retoucher = await staff("RETOUCHER", "retoucher");
    const outsider = await staff("RETOUCHER", "unassigned");
    const customer = await api.studio.saveCustomer.mutate({ name: `HTTP acceptance ${suffix}`, phone: "123456789", notes: "Isolated acceptance record" });
    const pack = await api.studio.savePackage.mutate({ name: `HTTP package ${suffix}`, price: "100.00", retouchLimit: 1, revisionLimit: 1 });
    const deadline = new Date(Date.now() + 30 * 86400000);
    const order = await api.studio.createOrder.mutate({ customerId: customer.id, packageId: pack.id, requirements: "Verify private image lifecycle", deadline });
    await api.studio.schedule.mutate({ orderId: order.id, photographerId: photographer.account.id, startsAt: new Date(Date.now() + 86400000), endsAt: new Date(Date.now() + 90000000) });
    const originalBytes = await sharp({ create: { width: 16, height: 16, channels: 3, background: "#d14f68" } }).png().toBuffer();
    const revisedBytes = await sharp(originalBytes).jpeg().toBuffer();
    const upload = (request: APIRequestContext, target: string, kind: "original" | "version", buffer: Buffer, mimeType = "image/png") => request.post("/api/uploads", {
      headers: { origin }, multipart: { target, kind, file: { name: mimeType === "image/png" ? "portrait.png" : "revision.jpg", mimeType, buffer } },
    });
    const originalResponse = await upload(photographer.request, order.id, "original", originalBytes);
    expect(originalResponse.status(), await originalResponse.text()).toBe(201);
    const original = z.object({ id: z.string(), assetId: z.string() }).parse(await originalResponse.json());
    const download = await photographer.request.get(`/api/files/${original.assetId}?download`);
    expect(download.status()).toBe(200);
    expect(download.headers()["content-disposition"]).toContain("attachment");
    expect(await download.body()).toEqual(originalBytes);
    expect((await outsider.request.get(`/api/files/${original.assetId}`)).status()).toBe(403);
    await photographer.api.studio.completeShoot.mutate({ orderId: order.id });
    await api.studio.select.mutate({ orderId: order.id, photoIds: [original.id], confirm: true, summary: "Customer confirmed the original" });
    expect((await upload(photographer.request, order.id, "original", originalBytes)).status()).toBe(400);
    const detail = await api.studio.order.query({ orderId: order.id });
    const task = detail.tasks[0];
    if (!task) throw new Error("Selection confirmation did not create a task.");
    await api.studio.task.mutate({ taskId: task.id, action: "assign", assigneeId: retoucher.account.id, deadline });
    await retoucher.api.studio.task.mutate({ taskId: task.id, action: "start" });
    expect((await upload(outsider.request, task.id, "version", originalBytes)).status()).toBe(400);
    const firstResponse = await upload(retoucher.request, task.id, "version", originalBytes);
    expect(firstResponse.status(), await firstResponse.text()).toBe(201);
    const versionSchema = z.object({ id: z.string(), number: z.number(), assetId: z.string() });
    const first = versionSchema.parse(await firstResponse.json());
    expect(first.number).toBe(1);
    await api.studio.task.mutate({ taskId: task.id, action: "request", versionId: first.id, summary: "Customer requested a JPEG revision" });
    const revisedResponse = await upload(retoucher.request, task.id, "version", revisedBytes, "image/jpeg");
    expect(revisedResponse.status(), await revisedResponse.text()).toBe(201);
    const revised = versionSchema.parse(await revisedResponse.json());
    expect(revised.number).toBe(2);
    await api.studio.task.mutate({ taskId: task.id, action: "approve", versionId: revised.id, summary: "Customer approved version 2" });
    await api.studio.send.mutate({ orderId: order.id, channel: "Acceptance test", reference: "Verified downloaded bytes; simulated manual transfer" });
    const delivered = await api.studio.order.query({ orderId: order.id });
    expect(delivered.delivery?.items.map((item) => item.versionId)).toEqual([revised.id]);
    expect(delivered.tasks[0]?.requests[0]?.responseVersionId).toBe(revised.id);
    const final = await manager.get(`/api/files/${revised.assetId}?download`);
    expect(final.status()).toBe(200);
    expect(final.headers()["content-type"]).toBe("image/jpeg");
    expect(final.headers()["cache-control"]).toBe("private, no-store");
    expect(await final.body()).toEqual(revisedBytes);
    expect((await outsider.request.get(`/api/files/${revised.assetId}?download`)).status()).toBe(403);
    expect((await upload(retoucher.request, task.id, "version", revisedBytes, "image/jpeg")).status()).toBe(400);
    await api.studio.acknowledge.mutate({ orderId: order.id, summary: "Acceptance download verified" });
    expect((await api.studio.order.query({ orderId: order.id })).stage).toBe("DELIVERED");
  } finally {
    for (const request of contexts) await request.dispose();
  }
});

test("delivered private image bytes remain available after recovery", async ({ playwright, baseURL }) => {
  test.skip(process.env.STUDIO_PERSISTENCE_TEST !== "1", "Requires the isolated lifecycle acceptance records.");
  if (!baseURL) throw new Error("A test base URL is required.");
  const request = await playwright.request.newContext({ baseURL });
  try {
    await signIn(request, "admin", adminPassword);
    const api = studioClient(request, baseURL);
    const orders = await api.studio.orders.query({ search: "HTTP acceptance", stage: "DELIVERED" });
    expect(orders.records.length).toBeGreaterThan(0);
    const detail = await api.studio.order.query({ orderId: orders.records[0].id });
    const task = detail.tasks[0];
    const version = task?.versions.find((item) => item.id === task.approvedVersionId);
    if (!version) throw new Error("The restored approved version is missing.");
    expect(detail.delivery?.items.map((item) => item.versionId)).toEqual([version.id]);
    const expected = await sharp({ create: { width: 16, height: 16, channels: 3, background: "#d14f68" } }).png().toBuffer();
    const response = await request.get(`/api/files/${version.assetId}?download`);
    expect(response.status()).toBe(200);
    expect(await response.body()).toEqual(await sharp(expected).jpeg().toBuffer());
  } finally {
    await request.dispose();
  }
});

test("five staff sessions read 100 orders and 500 photo records", async ({ playwright, baseURL }, testInfo) => {
  test.skip(process.env.STUDIO_PERFORMANCE_TEST !== "1", "Creates data only on an explicitly selected isolated deployment.");
  test.setTimeout(180000);
  if (!baseURL) throw new Error("A test base URL is required.");
  const contexts: APIRequestContext[] = [];
  const context = async () => {
    const request = await playwright.request.newContext({ baseURL });
    contexts.push(request);
    return request;
  };
  try {
    const manager = await context();
    await signIn(manager, "admin", adminPassword);
    const api = studioClient(manager, baseURL);
    const suffix = randomUUID();
    const password = randomUUID();
    const username = `perf-photo-${suffix}`;
    const photographer = await api.user.register.mutate({ username, password, role: "PHOTOGRAPHER", email: `${username}@example.com` });
    const photoSession = await context();
    await signIn(photoSession, username, password);
    const customer = await api.studio.saveCustomer.mutate({ name: `Performance ${suffix}`, phone: "123456789", notes: "Isolated synthetic benchmark" });
    const pack = await api.studio.savePackage.mutate({ name: `Performance ${suffix}`, price: "100.00", retouchLimit: 5, revisionLimit: 1 });
    const bytes = await sharp({ create: { width: 16, height: 16, channels: 3, background: "#247b68" } }).png().toBuffer();
    const orderIds: string[] = [];
    for (let index = 0; index < 100; index++) {
      const order = await api.studio.createOrder.mutate({ customerId: customer.id, packageId: pack.id, requirements: "Performance fixture", deadline: new Date(Date.now() + 365 * 86400000) });
      orderIds.push(order.id);
      const startsAt = new Date(Date.now() + (index + 1) * 86400000);
      await api.studio.schedule.mutate({ orderId: order.id, photographerId: photographer.id, startsAt, endsAt: new Date(startsAt.getTime() + 3600000) });
      for (let photo = 0; photo < 5; photo++) {
        const response = await photoSession.post("/api/uploads", { headers: { origin: new URL(baseURL).origin }, multipart: { target: order.id, kind: "original", file: { name: "fixture.png", mimeType: "image/png", buffer: bytes } } });
        expect(response.status()).toBe(201);
      }
    }
    const staff = await Promise.all(Array.from({ length: 5 }, async (_, index) => {
      const name = `perf-reception-${index}-${suffix}`;
      await api.user.register.mutate({ username: name, password, role: "RECEPTION", email: `${name}@example.com` });
      const request = await context();
      await signIn(request, name, password);
      return studioClient(request, baseURL);
    }));
    const samples: Record<"list" | "detail", number[]> = { list: [], detail: [] };
    await Promise.all(staff.map(async (client) => {
      for (let iteration = 0; iteration < 45; iteration++) {
        let started = performance.now();
        const list = await client.studio.orders.query({ search: customer.name, page: iteration % 5 + 1 });
        expect(list.total).toBe(100);
        if (iteration >= 5) samples.list.push(performance.now() - started);
        started = performance.now();
        const order = await client.studio.order.query({ orderId: orderIds[iteration % orderIds.length] });
        expect(order.photos).toHaveLength(5);
        if (iteration >= 5) samples.detail.push(performance.now() - started);
      }
    }));
    const result = Object.fromEntries(Object.entries(samples).map(([name, values]) => {
      values.sort((first, second) => first - second);
      return [name, { requests: values.length, p95Ms: Math.round(values[Math.ceil(values.length * 0.95) - 1]), maxMs: Math.round(values[values.length - 1]) }];
    }));
    console.log("PERFORMANCE", JSON.stringify({ concurrentSessions: 5, orders: 100, photos: 500, warmupPerSession: 5, result }));
    await testInfo.attach("performance.json", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
    expect(result.list?.p95Ms).toBeLessThanOrEqual(2000);
    expect(result.detail?.p95Ms).toBeLessThanOrEqual(2000);
  } finally {
    for (const request of contexts) await request.dispose();
  }
});

test("manager can sign in and see real studio records", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle("Photography Studio");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole("button", { name: /sign in|\u767b\u5f55/i }).click();
  await page.waitForURL("**/main", { timeout: 30000 });
  await expect(page.getByRole("heading", { name: "Photography Studio" })).toBeVisible();
  await expect(page).toHaveTitle("Photography Studio");
  await expect(page.getByText("DEMO-001", { exact: false })).toBeVisible();
  await page.getByRole("tab", { name: "Packages", exact: true }).click();
  await expect(page.getByText("Portrait Session", { exact: false })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Customers", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Customers", exact: true }).click();
  await expect(page.getByText("Alex Chen", { exact: false })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "test-results/studio-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/studio-mobile.png", fullPage: true });
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("link", { name: "Staff accounts" }).click();
  await page.getByRole("button", { name: "admin", exact: true }).click();
  await expect(page.getByRole("dialog").locator('input[name="username"]')).toHaveValue("admin");
  await page.keyboard.press("Escape");
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
  await page.goto("/login");
  await page.locator('input[name="username"]').fill("admin");
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.getByRole("button", { name: /sign in|\u767b\u5f55/i }).click();
  await page.waitForURL("**/main", { timeout: 30000 });
  const response = await page.request.post("/api/uploads", {
    headers: { origin: "https://invalid.example" },
    multipart: { target: "unknown", kind: "original" },
  });
  expect(response.status()).toBe(403);
});