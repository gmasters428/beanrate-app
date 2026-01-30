import fs from "fs";
import path from "path";
import { chromium } from "playwright";

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
const bypassToken =
  process.env.VERCEL_PROTECTION_BYPASS ||
  process.env.VERCEL_AUTOMATION_BYPASS ||
  "";

if (rawEmail !== email || rawPassword !== password) {
  console.warn("Trimmed whitespace from DEV_SMOKE_EMAIL or DEV_SMOKE_PASSWORD.");
}

if (!email || !password) {
  console.error("Missing DEV_SMOKE_EMAIL or DEV_SMOKE_PASSWORD env vars.");
  process.exit(1);
}

if (!rawBaseUrl) {
  console.error("Missing base URL env var. Set DEV_SMOKE_BASE_URL or NEXT_PUBLIC_SITE_URL.");
  process.exit(1);
}

const normalizeUrl = (value) => {
  let url = value.trim();
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url.replace(/\/+$/, "");
};

const baseUrl = normalizeUrl(rawBaseUrl);
const refreshes = Number(process.env.DEV_SMOKE_PROFILE_REFRESHES || 5);
const timeoutMs = Number(process.env.DEV_SMOKE_PROFILE_TIMEOUT_MS || 15000);

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const logDir = path.join("debug-artifacts", "automation");
ensureDir(logDir);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logPath = path.join(logDir, `profile-refresh-${timestamp}.log`);
const harPath = path.join(logDir, `profile-refresh-${timestamp}.har`);

const writeLog = (line) => {
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${line}\n`);
};

const main = async () => {
  const browser = await chromium.launch({ headless: true });
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

  page.on("console", (msg) => {
    writeLog(`console.${msg.type()}: ${msg.text()}`);
  });
  page.on("pageerror", (error) => {
    writeLog(`pageerror: ${error?.message || String(error)}`);
  });

  let latestRatingsLength = null;
  let hasNonEmptyRatings = false;

  const resetRatingsFlags = () => {
    latestRatingsLength = null;
    hasNonEmptyRatings = false;
  };

  page.on("response", async (response) => {
    try {
      const url = response.url();
      if (!url.includes("/rest/v1/ratings")) return;
      const method = response.request().method();
      if (method !== "GET") return;
      const data = await response.json();
      if (Array.isArray(data)) {
        latestRatingsLength = data.length;
        if (data.length > 0) {
          hasNonEmptyRatings = true;
        }
      }
    } catch (error) {
      writeLog(`ratings response parse failed: ${error?.message || String(error)}`);
    }
  });

  const waitForRatings = async (label) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (hasNonEmptyRatings) {
        writeLog(`${label}: ratings ok (count=${latestRatingsLength})`);
        return;
      }
      await page.waitForTimeout(250);
    }
    const detail = latestRatingsLength === null ? "no response" : `count=${latestRatingsLength}`;
    throw new Error(`${label}: ratings missing (${detail})`);
  };

  try {
    writeLog("Starting login flow.");
    await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded", timeout: timeoutMs });

    const fillAndSubmit = async () => {
      const emailInput = page.locator('input[name="email"], input[type="email"]').first();
      const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
      if (!(await emailInput.isVisible()) || !(await passwordInput.isVisible())) {
        await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded", timeout: timeoutMs });
      }
      await emailInput.waitFor({ state: "visible", timeout: timeoutMs });
      await passwordInput.waitFor({ state: "visible", timeout: timeoutMs });
      await emailInput.fill(email);
      await passwordInput.fill(password);
      await page.getByRole("button", { name: /sign\s*in/i }).click();
    };

    await fillAndSubmit();

    await Promise.race([
      page.waitForURL(/\/profile/, { timeout: timeoutMs }).catch(() => {}),
      page.locator("text=Ratings").first().waitFor({ state: "visible", timeout: timeoutMs }).catch(() => {}),
    ]);

    if (!page.url().includes("/profile")) {
      await page.goto(`${baseUrl}/profile`, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    }

    await page.locator("text=Ratings").first().waitFor({ state: "visible", timeout: timeoutMs });

    resetRatingsFlags();
    await waitForRatings("initial");

    for (let i = 0; i < refreshes; i += 1) {
      resetRatingsFlags();
      writeLog(`refresh ${i + 1}...`);
      await page.reload({ waitUntil: "domcontentloaded", timeout: timeoutMs });
      await page.locator("text=Ratings").first().waitFor({ state: "visible", timeout: timeoutMs });
      await waitForRatings(`refresh-${i + 1}`);
    }

    writeLog("Profile refresh smoke test passed.");
    await context.close();
    await browser.close();
    console.log("Profile refresh smoke test passed.");
  } catch (error) {
    writeLog(`Smoke test failed: ${error?.message || String(error)}`);
    await context.close();
    await browser.close();
    console.error("Profile refresh smoke test failed.");
    process.exit(1);
  }
};

main();
