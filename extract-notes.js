/**
 * Regenerates SPEAKER-NOTES.md from the <aside class="notes"> blocks in
 * each HTML slide file. Run after editing notes in the HTML source.
 */
const fs = require("fs");
const path = require("path");

const slidesDir = path.join(__dirname, "slides");
const outputPath = path.join(__dirname, "SPEAKER-NOTES.md");

const files = fs
  .readdirSync(slidesDir)
  .filter((f) => f.endsWith(".html"))
  .sort();

const sections = [];

for (const file of files) {
  const html = fs.readFileSync(path.join(slidesDir, file), "utf8");

  // Extract slide number from filename
  const num = file.slice(0, 2);

  // Extract a human-readable title: try <h1> or <h2>, fall back to filename
  const titleMatch = html.match(/<h[12][^>]*>(.*?)<\/h[12]>/s);
  let title = titleMatch
    ? titleMatch[1]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : file.replace(".html", "").replace(/^\d+-/, "");

  // Extract notes
  const notesMatch = html.match(/<aside class="notes">([\s\S]*?)<\/aside>/);
  if (!notesMatch) continue;

  const bullets = notesMatch[1]
    .split(/<\/p>/)
    .map((chunk) => chunk.replace(/<p>/g, "").trim())
    .filter(Boolean)
    // Unescape HTML entities
    .map((b) => b.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));

  sections.push({ num, title, bullets });
}

// Assemble the markdown
let md = "# Speaker Notes\n\n";
md += "Notes per slide. Not a script - prompts and key points to hit. ";
md += "Know the material; use these to stay on track.\n\n";
md += "---\n";

for (const { num, title, bullets } of sections) {
  md += "\n## " + num + " - " + title + "\n\n";
  for (const b of bullets) {
    md += "- " + b + "\n";
  }
}

fs.writeFileSync(outputPath, md);
console.log("Written %d sections to %s", sections.length, outputPath);
