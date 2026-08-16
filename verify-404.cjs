const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on("response", (r) => r.status() >= 400 && console.log(r.status(), r.url()));
  await page.goto("https://yuanyinglong-91.github.io/pixelstage/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await browser.close();
})();
