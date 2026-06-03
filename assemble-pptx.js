const PptxGenJS = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const slidesDir = path.join(__dirname, "slides");

/**
 * Extract plain-text speaker notes from an HTML slide file.
 * Looks for <aside class="notes">...</aside> and strips tags.
 */
function extractNotes(htmlFile) {
  if (!fs.existsSync(htmlFile)) return "";
  const html = fs.readFileSync(htmlFile, "utf8");
  const match = html.match(/<aside class="notes">([\s\S]*?)<\/aside>/);
  if (!match) return "";
  return match[1].replace(/<p>/g, "").replace(/<\/p>/g, "\n").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
}

async function main() {
  const outputDir = path.join(__dirname, "output");
  const pptxPath = path.join(__dirname, "output", "slides.pptx");

  const pngFiles = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".png"))
    .sort();

  if (pngFiles.length === 0) {
    console.error("No PNGs found in output/. Run `npm run screenshot` first.");
    process.exit(1);
  }

  // Build a map of slide name (without extension) -> HTML path
  const htmlFiles = fs.readdirSync(slidesDir).filter((f) => f.endsWith(".html"));
  const htmlMap = new Map();
  for (const f of htmlFiles) {
    htmlMap.set(f.replace(".html", ""), path.join(slidesDir, f));
  }

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "HD", width: 13.333, height: 7.5 }); // 16:9
  pptx.layout = "HD";

  let notesCount = 0;

  for (const file of pngFiles) {
    const slide = pptx.addSlide();
    slide.addImage({
      path: path.join(outputDir, file),
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
    });

    // Find matching HTML file and extract notes
    const stem = file.replace(".png", "");
    const htmlPath = htmlMap.get(stem);
    if (htmlPath) {
      const notes = extractNotes(htmlPath);
      if (notes) {
        slide.addNotes(notes);
        notesCount++;
      }
    }

    console.log("Added: " + file);
  }

  await pptx.writeFile({ fileName: pptxPath });
  console.log("Done. Written to " + pptxPath + " (" + notesCount + " slides with notes)");
}

main().catch(console.error);
