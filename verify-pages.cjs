const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("https://yuanyinglong-91.github.io/pixelstage/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const title = await page.textContent("body");
  console.log(title.includes("HD-2D") ? "OK: homepage renders" : "FAIL: homepage empty");
  // editor route via hash
  await page.goto("https://yuanyinglong-91.github.io/pixelstage/#/editor", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const demo = page.getByRole("button", { name: /Load demo scene|加载示例场景/ });
  if (await demo.isVisible().catch(() => false)) {
    await demo.click();
    await page.waitForTimeout(2500);
    console.log("OK: editor + demo scene loads online");
  } else console.log("FAIL: editor demo button missing");
  await page.screenshot({ path: "C:/tmp/pages-live.png" });
  console.log(errors.length ? "console errors:\n" + errors.slice(0, 3).join("\n") : "OK: no console errors");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
