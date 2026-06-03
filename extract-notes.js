/**
 * Regenerates SPEAKER-NOTES.md from the <aside class="notes"> blocks in
 * each HTML slide file. Run after editing notes in the HTML source.
 */
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

const slidesDir = path.join(__dirname, 'slides')
const outputPath = path.join(__dirname, 'SPEAKER-NOTES.md')

const files = fs.readdirSync(slidesDir)
  .filter(f => f.endsWith('.html'))
  .sort()

const sections = []

for (const file of files) {
  const html = fs.readFileSync(path.join(slidesDir, file), 'utf8')
  const $ = cheerio.load(html)

  // Extract slide number from filename
  const num = file.slice(0, 2)

  // Extract a human-readable title: try <h1> or <h2>, fall back to filename
  const heading = $('h1, h2').first()
  if (heading.length) heading.find('br').replaceWith(' ')
  const title = heading.length
    ? heading.text().replace(/\s+/g, ' ').trim().replace(/\.+$/, '')
    : file.replace('.html', '').replace(/^\d+-/, '')

  // Extract notes
  const aside = $('aside.notes')
  if (!aside.length) continue

  const bullets = aside.find('p')
    .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
    .get()
  if (bullets.length === 0) continue

  sections.push({ num, title, bullets })
}

// Assemble the markdown
let md = '# Speaker Notes\n\n'
md += 'Notes per slide. Not a script - prompts and key points to hit. '
md += 'Know the material; use these to stay on track.\n\n'
md += '---\n'

for (const { num, title, bullets } of sections) {
  md += '\n## ' + num + ' - ' + title + '\n\n'
  for (const b of bullets) {
    md += '- ' + b + '\n'
  }
}

fs.writeFileSync(outputPath, md)
console.log('Written %d sections to %s', sections.length, outputPath)
