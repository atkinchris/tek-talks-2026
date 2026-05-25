const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

async function main() {
  const slidesDir = path.join(__dirname, 'slides')
  const outputDir = path.join(__dirname, 'output')

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

  const files = fs.readdirSync(slidesDir)
    .filter(f => f.endsWith('.html'))
    .sort()

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  for (const file of files) {
    const filePath = path.join(slidesDir, file)
    const outPath = path.join(outputDir, file.replace('.html', '.png'))
    await page.goto('file://' + filePath)
    await page.screenshot({ path: outPath })
    console.log('Captured: ' + file)
  }

  await browser.close()
  console.log('Done. ' + files.length + ' slides exported to output/')
}

main().catch(console.error)
