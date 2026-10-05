/**
 * Records the demo video segments:
 *  A) the app running at localhost:5173 (start `npm run dev` first)
 *  B) the .kiro walkthrough in demo/tour.html
 * Output: demo/out/app.webm + demo/out/tour.webm
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "out");
mkdirSync(OUT, { recursive: true });

const SIZE = { width: 1600, height: 900 };

async function withVideo(name, fn) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: OUT, size: SIZE },
  });
  const page = await context.newPage();
  await fn(page);
  await context.close();
  await browser.close();
}

// ---------- Segment A: app ----------
await withVideo("app", async (page) => {
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForSelector(".card");
  await page.waitForTimeout(2500);

  // slow scroll through the board
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(700);
  }
  await page.mouse.wheel(0, -2000);
  await page.waitForTimeout(1200);

  // triage actions on the first three cards
  const cards = page.locator(".card");
  await cards.nth(0).locator(".action").nth(1).click(); // star
  await page.waitForTimeout(600);
  await cards.nth(1).locator(".action").nth(2).click(); // later
  await page.waitForTimeout(600);
  await cards.nth(2).locator(".action").nth(0).click(); // read
  await page.waitForTimeout(900);

  // filter: unread view
  await page.locator(".nav-item", { hasText: "Unread" }).click();
  await page.waitForTimeout(1400);

  // filter: a source
  await page.locator(".nav-item", { hasText: "Zenn AI" }).click();
  await page.waitForTimeout(1400);

  // search
  await page.locator(".search").fill("claude");
  await page.waitForTimeout(1400);
  await page.locator(".search").fill("");
  await page.waitForTimeout(800);

  // tag filter
  await page.locator(".tag-cloud .tag", { hasText: "release" }).first().click();
  await page.waitForTimeout(1500);

  // back to all
  await page.locator(".nav-item", { hasText: "All items" }).click();
  await page.locator(".nav-item", { hasText: "Every source" }).click();
  await page.waitForTimeout(1200);
});

// ---------- Segment B: .kiro tour ----------
await withVideo("tour", async (page) => {
  await page.goto(`file:///${path.join(__dirname, "tour.html").replace(/\\/g, "/")}`);
  await page.waitForTimeout(2200);
  const slides = await page.locator(".slide").count();
  for (let i = 1; i < slides; i++) {
    await page.locator(".slide").nth(i).scrollIntoViewIfNeeded();
    await page.waitForTimeout(i === slides - 1 ? 2600 : 3400);
  }
});

console.log("segments written to", OUT);
