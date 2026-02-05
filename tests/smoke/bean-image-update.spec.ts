import fs from "fs";
import path from "path";
import { test } from "@playwright/test";

const rawEmail = process.env.DEV_SMOKE_EMAIL || "";
const rawPassword = process.env.DEV_SMOKE_PASSWORD || "";
const email = rawEmail.trim();
const password = rawPassword.trim();
const rawBaseUrl =
  process.env.DEV_SMOKE_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_VERCEL_URL ||
  process.env.VERCEL_URL ||
  "";
const rawBypassToken =
  process.env.VERCEL_PROTECTION_BYPASS ||
  process.env.VERCEL_AUTOMATION_BYPASS ||
  "";
const bypassToken = rawBypassToken.trim();

const normalizeUrl = (value: string) => {
  let url = value.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
};

const baseUrl = normalizeUrl(rawBaseUrl);
const timeoutMs = Number(process.env.DEV_SMOKE_PROFILE_TIMEOUT_MS || 15000);

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const SMOKE_IMAGE_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAQ0lEQVR42u3PQQ0AAAgDIN8/9K1h" +
  "gQY3G2wGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwE1kAAcF3bYcAAAAASUVORK5CYII=";

test("admin bean image update @smoke", async ({ browser }) => {
  if (rawEmail !== email || rawPassword !== password) {
    console.warn("Trimmed whitespace from DEV_SMOKE_EMAIL or DEV_SMOKE_PASSWORD.");
  }

  if (!email || !password) {
    throw new Error("Missing DEV_SMOKE_EMAIL or DEV_SMOKE_PASSWORD env vars.");
  }

  if (!rawBaseUrl) {
    throw new Error("Missing base URL env var. Set DEV_SMOKE_BASE_URL or NEXT_PUBLIC_SITE_URL.");
  }

  const logDir = path.join("debug-artifacts", "automation");
  ensureDir(logDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logPath = path.join(logDir, `bean-image-update-${timestamp}.log`);
  const harPath = path.join(logDir, `bean-image-update-${timestamp}.har`);

  const writeLog = (line: string) => {
    fs.appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`);
  };

  const extraHTTPHeaders = bypassToken
    ? {
        "x-vercel-protection-bypass": bypassToken,
        "x-vercel-set-bypass-cookie": "true",
      }
    : undefined;

  const context = await browser.newContext({
    recordHar: { path: harPath, content: "omit" },
    extraHTTPHeaders,
  });
  const page = await context.newPage();

  if (bypassToken) {
    writeLog("Bypass token present; requesting bypass cookie.");
    try {
      await context.request.get(baseUrl, { headers: extraHTTPHeaders });
    } catch (error: any) {
      writeLog(`Bypass cookie request failed: ${error?.message || String(error)}`);
    }
  } else {
    writeLog("Bypass token missing; SSO protection may block automation.");
  }

  page.on("console", (msg) => {
    writeLog(`console.${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (error) => {
    writeLog(`pageerror: ${error?.message || String(error)}`);
  });

  try {
    writeLog("Starting login flow.");
    await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded", timeout: timeoutMs });

    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await emailInput.waitFor({ state: "visible", timeout: timeoutMs });
    await passwordInput.waitFor({ state: "visible", timeout: timeoutMs });
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await page.getByRole("button", { name: /sign\s*in/i }).click();

    await Promise.race([
      page.waitForURL(/\/profile/, { timeout: timeoutMs }).catch(() => {}),
      page.locator("text=Ratings").first().waitFor({ state: "visible", timeout: timeoutMs }).catch(() => {}),
    ]);

    if (!page.url().includes("/profile")) {
      await page.goto(`${baseUrl}/profile`, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    }

    const ratingDetailsLink = page.getByRole("link", { name: /view details/i }).first();
    await ratingDetailsLink.waitFor({ state: "visible", timeout: timeoutMs });
    await ratingDetailsLink.click();
    await page.waitForURL(/\/rating\//, { timeout: timeoutMs });

    const beanLink = page.locator('a[href^="/bean/"]').first();
    await beanLink.waitFor({ state: "visible", timeout: timeoutMs });
    await beanLink.click();
    await page.waitForURL(/\/bean\//, { timeout: timeoutMs });

    await page.getByText("Admin: Update Bean Image").waitFor({ state: "visible", timeout: timeoutMs });

    const fileInput = page.locator("#bean-image-upload");
    const buffer = Buffer.from(SMOKE_IMAGE_BASE64, "base64");
    await fileInput.setInputFiles({
      name: "smoke-bean.png",
      mimeType: "image/png",
      buffer,
    });

    await page.getByRole("button", { name: /save image/i }).click();
    await page
      .getByText("Image updated", { exact: true })
      .first()
      .waitFor({ state: "visible", timeout: timeoutMs });

    writeLog("Bean image update smoke test passed.");
  } catch (error: any) {
    writeLog(`Smoke test failed: ${error?.message || String(error)}`);
    throw error;
  } finally {
    await context.close();
  }
});
