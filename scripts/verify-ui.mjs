import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const OUT = "./.playwright-verify";
mkdirSync(OUT, { recursive: true });

const results = {};
const consoleErrors = [];
const pageErrors = [];
const badResponses = [];

const browser = await chromium.launch();

async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => pageErrors.push(String(e)));
  page.on("response", (r) => {
    if (r.status() >= 400) badResponses.push(`${r.status()} ${r.request().method()} ${r.url()}`);
  });
  return { ctx, page };
}

async function detectNextError(page) {
  return page.evaluate(() => {
    const portal = document.querySelector("nextjs-portal");
    const overlay = document.querySelector("[data-nextjs-dialog], #nextjs__container_errors_label");
    return Boolean(portal || overlay);
  });
}

async function generatePlan(page) {
  const btn = page.getByRole("button", { name: /generate plan/i });
  await btn.waitFor({ state: "visible" });
  // The form is a client island; a click before hydration is a no-op. Retry
  // until PlanView (its tabs) actually mounts.
  for (let attempt = 0; attempt < 4; attempt++) {
    await btn.click();
    try {
      await page.getByRole("tab").first().waitFor({ state: "visible", timeout: 5000 });
      await page.getByRole("tabpanel").waitFor({ state: "visible", timeout: 5000 });
      return;
    } catch {
      await page.waitForTimeout(700);
    }
  }
  throw new Error("PlanView did not render after Generate clicks");
}

// ---------------------------------------------------------------------------
// 1) DESKTOP
// ---------------------------------------------------------------------------
{
  const { page } = await newPage({ width: 1280, height: 900 });
  const resp = await page.goto(`${BASE}/build`, { waitUntil: "networkidle" });
  results.buildStatus = resp?.status();
  results.nextErrorOverlay = await detectNextError(page);

  // Fonts
  results.fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const h1 = document.querySelector("h1");
    const fam = h1 ? getComputedStyle(h1).fontFamily : "";
    const loaded = [...document.fonts].map((f) => ({ family: f.family, status: f.status }));
    return {
      h1FontFamily: fam,
      anyLoaded: loaded.some((f) => f.status === "loaded"),
      count: loaded.length,
      families: [...new Set(loaded.map((f) => f.family))],
    };
  });

  await page.screenshot({ path: `${OUT}/01-build-desktop.png`, fullPage: true });

  await generatePlan(page);
  results.planTitle = await page.getByRole("heading", { level: 1 }).innerText();

  // Disclaimer present?
  results.disclaimerVisible = await page
    .getByText(/not medical or professional training advice/i)
    .isVisible();

  // Keyboard nav on the weekly tabs
  const tabs = page.getByRole("tab");
  results.tabCount = await tabs.count();
  await tabs.first().focus();
  const kb = { steps: [] };
  async function activeTab() {
    return page.evaluate(() => {
      const el = document.activeElement;
      return {
        role: el?.getAttribute("role"),
        selected: el?.getAttribute("aria-selected"),
        label: el?.textContent?.replace(/\s+/g, " ").trim().slice(0, 40),
        outlineWidth: getComputedStyle(el).outlineWidth,
        outlineColor: getComputedStyle(el).outlineColor,
      };
    });
  }
  kb.start = await activeTab();
  await page.keyboard.press("ArrowRight");
  kb.afterArrowRight = await activeTab();
  await page.keyboard.press("End");
  kb.afterEnd = await activeTab();
  await page.keyboard.press("Home");
  kb.afterHome = await activeTab();
  results.keyboard = kb;

  // Focus-ring debug: after a keyboard move, capture the full outline + the
  // resolved volt token, and screenshot the tablist so we can eyeball the ring.
  await tabs.nth(1).focus();
  await page.keyboard.press("ArrowLeft");
  results.focusRing = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    const volt = getComputedStyle(document.documentElement).getPropertyValue("--color-volt").trim();
    return {
      outline: cs.outline,
      outlineColor: cs.outlineColor,
      outlineOffset: cs.outlineOffset,
      boxShadow: cs.boxShadow,
      voltToken: volt,
    };
  });
  await page.getByRole("tablist").screenshot({ path: `${OUT}/05-focus-ring.png` });

  // Panel updates with selection (check the visible day card heading changes)
  await tabs.first().focus();
  const firstPanel = await page.getByRole("tabpanel").innerText();
  await page.keyboard.press("ArrowRight");
  const secondPanel = await page.getByRole("tabpanel").innerText();
  results.panelChangesOnArrow = firstPanel !== secondPanel;

  await page.screenshot({ path: `${OUT}/02-plan-desktop.png`, fullPage: true });

  results.desktopOverflowPx = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

// ---------------------------------------------------------------------------
// 2) MOBILE (iPhone-ish narrow viewport)
// ---------------------------------------------------------------------------
{
  const { page } = await newPage({ width: 390, height: 844 });
  await page.goto(`${BASE}/build`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/03-build-mobile.png`, fullPage: true });
  results.mobileFormOverflowPx = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  await generatePlan(page);
  await page.screenshot({ path: `${OUT}/04-plan-mobile.png`, fullPage: true });
  results.mobilePlanOverflowPx = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  results.mobileDisclaimerVisible = await page
    .getByText(/not medical or professional training advice/i)
    .isVisible();
}

results.consoleErrors = consoleErrors;
results.pageErrors = pageErrors;
results.badResponses = badResponses;

await browser.close();
console.log(JSON.stringify(results, null, 2));
