import { chromium } from "playwright";

let browser, context, page;

export async function init() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"]
    });
    context = await browser.newContext();
    page = await context.newPage();
    await page.goto('https://revolutionehr.com/static/#/')
  }
  console.log("Browser initialized");
  return { browser, context, page };
}

export function getPage() {
  return { browser, context, page };
}

