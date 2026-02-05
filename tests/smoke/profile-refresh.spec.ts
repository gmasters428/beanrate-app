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
const refreshes = Number(process.env.DEV_SMOKE_PROFILE_REFRESHES || 5);
const timeoutMs = Number(process.env.DEV_SMOKE_PROFILE_TIMEOUT_MS || 15000);

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

test("profile refresh @smoke", async ({ browser }) => {
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
  const logPath = path.join(logDir, `profile-refresh-${timestamp}.log`);
  const harPath = path.join(logDir, `profile-refresh-${timestamp}.har`);

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

  let latestRatingsLength: number | null = null;
  let hasNonEmptyRatings = false;

  const resetRatingsFlags = () => {
    latestRatingsLength = null;
    hasNonEmptyRatings = false;
  };

  page.on("response", async (response) => {
    try {
      const url = response.url();
      if (url.includes("/api/ratings/user")) {
        writeLog(`api ratings response ${response.status()} ${url}`);
      }
      if (!url.includes("/rest/v1/ratings")) return;
      const method = response.request().method();
      if (method !== "GET") return;
      writeLog(`ratings response ${response.status()} ${url}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        latestRatingsLength = data.length;
        if (data.length > 0) {
          hasNonEmptyRatings = true;
        }
      }
    } catch (error: any) {
      writeLog(`ratings response parse failed: ${error?.message || String(error)}`);
    }
  });

  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.includes("/api/ratings/user")) {
      const failure = request.failure();
      writeLog(`api ratings request failed: ${failure?.errorText || "unknown"} ${url}`);
    }
    if (!url.includes("/rest/v1/ratings")) return;
    const failure = request.failure();
    writeLog(`ratings request failed: ${failure?.errorText || "unknown"} ${url}`);
  });

  const hasRatingsInDom = async () => {
    const emptyState = page.locator("text=You haven't rated any coffee beans yet.");
    const emptyVisible = await emptyState.isVisible().catch(() => false);
    if (emptyVisible) return false;
    const cardCount = await page.locator("text=View Details").count();
    return cardCount > 0;
  };

  const waitForRatings = async (label: string) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (hasNonEmptyRatings) {
        writeLog(`${label}: ratings ok (count=${latestRatingsLength})`);
        return;
      }
      if (await hasRatingsInDom()) {
        writeLog(`${label}: ratings ok (dom)`);
        return;
      }
      await page.waitForTimeout(250);
    }
    const emptyState = page.locator("text=You haven't rated any coffee beans yet.");
    const emptyVisible = await emptyState.isVisible().catch(() => false);
    const cardCount = await page.locator("text=View Details").count().catch(() => 0);
    const detail = latestRatingsLength === null ? "no response" : `count=${latestRatingsLength}`;
    throw new Error(
      `${label}: ratings missing (${detail}, emptyVisible=${emptyVisible}, cardCount=${cardCount})`,
    );
  };

  const logPageState = async (label: string) => {
    try {
      const state = await page.evaluate(() => {
        const userId = (window as any).__NEXT_DATA__?.props?.pageProps?.userId || "";
        const initialRatings = (window as any).__NEXT_DATA__?.props?.pageProps?.initialRatings;
        const initialRatingsLength = Array.isArray(initialRatings)
          ? initialRatings.length
          : initialRatings
            ? 1
            : 0;
        const initialRatingsState =
          initialRatings === undefined
            ? "missing"
            : Array.isArray(initialRatings)
              ? `array:${initialRatings.length}`
              : "value";
        const cookieCount = document.cookie
          .split(";")
          .map((value) => value.trim())
          .filter((value) => value.startsWith("sb-")).length;
        return { userId, cookieCount, initialRatingsLength, initialRatingsState };
      });
      writeLog(
        `${label}: pageProps.userId=${state.userId || "(empty)"}, sbCookies=${state.cookieCount}, initialRatings=${state.initialRatingsLength}, initialRatingsState=${state.initialRatingsState}`,
      );
    } catch (error: any) {
      writeLog(`${label}: failed to read page state (${error?.message || String(error)})`);
    }
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
      await page.locator("text=Ratings").first().waitFor({ state: "visible", timeout: timeoutMs });
    }
    await logPageState("initial");

    resetRatingsFlags();
    await waitForRatings("initial");

    for (let i = 0; i < refreshes; i += 1) {
      resetRatingsFlags();
      writeLog(`refresh ${i + 1}...`);
      await page.reload({ waitUntil: "domcontentloaded", timeout: timeoutMs });
      await page.locator("text=Ratings").first().waitFor({ state: "visible", timeout: timeoutMs });
      await logPageState(`refresh-${i + 1}`);
      await waitForRatings(`refresh-${i + 1}`);
    }

    writeLog("Profile refresh smoke test passed.");
  } catch (error: any) {
    writeLog(`Smoke test failed: ${error?.message || String(error)}`);
    throw error;
  } finally {
    await context.close();
  }
});
