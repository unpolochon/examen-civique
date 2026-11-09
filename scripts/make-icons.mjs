// Renders public/icon.svg to the PWA PNG icons with Playwright's Chromium.
// Run: npm run icons
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8')
// Full bleed: square background, for platforms that apply their own mask. The 2x2 tiles stay inside the maskable safe zone (80 % circle).
const fullBleed = svg.replace(' rx="112"', '')
const targets = [
  { file: 'icon-192.png', size: 192, source: svg },
  { file: 'icon-512.png', size: 512, source: svg },
  { file: 'icon-maskable-512.png', size: 512, source: fullBleed },
  // iOS rounds the corners itself and shows transparency as black.
  { file: 'apple-touch-icon.png', size: 180, source: fullBleed },
]

const browser = await chromium.launch()
for (const { file, size, source } of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${source}`,
  )
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname, omitBackground: true })
  await page.close()
}
await browser.close()
