const PptxGenJS = require('pptxgenjs')
const fs = require('fs')
const path = require('path')

async function main() {
  const outputDir = path.join(__dirname, 'output')
  const pptxPath = path.join(__dirname, 'output', 'slides.pptx')

  const files = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.png'))
    .sort()

  if (files.length === 0) {
    console.error('No PNGs found in output/. Run `npm run screenshot` first.')
    process.exit(1)
  }

  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'HD', width: 13.333, height: 7.5 }) // 16:9
  pptx.layout = 'HD'

  for (const file of files) {
    const slide = pptx.addSlide()
    slide.addImage({
      path: path.join(outputDir, file),
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    })
    console.log('Added: ' + file)
  }

  await pptx.writeFile({ fileName: pptxPath })
  console.log('Done. Written to ' + pptxPath)
}

main().catch(console.error)
