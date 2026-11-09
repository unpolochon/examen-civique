// Renders public/icon.svg to the PWA PNG icons with Playwright's Chromium.
// Run: npm run icons
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8')
const targets = [
  { file: 'icon-192.png', size: 192, background: 'transparent' },
  { file: 'icon-512.png', size: 512, background: 'transparent' },
  // iOS rounds the corners itself and shows transparency as black: fill the square.
  { file: 'apple-touch-icon.png', size: 180, background: '#5B5BD6' },
]

const browser = await chromium.launch()
for (const { file, size, background } of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } })
  await page.setContent(
    `<style>html,body{margin:0;background:${background}}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  )
  await page.screenshot({ path: new URL(`../public/${file}`, import.meta.url).pathname, omitBackground: true })
  await page.close()
}
await browser.close()
