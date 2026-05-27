#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "docs");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cpR(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      cpR(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function getSlides() {
  return fs
    .readdirSync(path.join(ROOT, "slides"))
    .filter((f) => f.endsWith(".html"))
    .sort();
}

// ---------------------------------------------------------------------------
// Gallery (index.html)
// ---------------------------------------------------------------------------

function renderGallery(slides) {
  const cards = slides
    .map(
      (slide) => `
    <a class="card" href="viewer/${slide}">
      <div class="thumb-wrap">
        <iframe src="slides/${slide}" scrolling="no" tabindex="-1"></iframe>
      </div>
      <span class="caption">${slide}</span>
    </a>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Slide Gallery</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #111; color: #eee; font-family: sans-serif; padding: 24px; }
    h1 { margin-bottom: 20px; font-size: 1.2rem; font-weight: normal; color: #aaa; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .card {
      display: flex; flex-direction: column; text-decoration: none; color: inherit;
      background: #222; border-radius: 6px; overflow: hidden;
      border: 2px solid transparent; transition: border-color 0.15s;
    }
    .card:hover { border-color: #fff; }
    .thumb-wrap {
      position: relative; width: 100%; padding-top: 56.25%; overflow: hidden; background: #000;
    }
    .thumb-wrap iframe {
      position: absolute; top: 0; left: 0;
      width: 1920px; height: 1080px;
      transform-origin: top left;
      pointer-events: none; border: none;
    }
    .caption { padding: 8px 10px; font-size: 0.75rem; color: #aaa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  </style>
</head>
<body>
  <h1>${slides.length} slides</h1>
  <div class="grid">
    ${cards}
  </div>
  <script>
    function scaleFrames() {
      document.querySelectorAll('.thumb-wrap').forEach(wrap => {
        const scale = wrap.offsetWidth / 1920;
        wrap.querySelector('iframe').style.transform = 'scale(' + scale + ')';
      });
    }
    scaleFrames();
    window.addEventListener('resize', scaleFrames);
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Viewer (one file per slide)
// ---------------------------------------------------------------------------

function renderViewer(slides, idx) {
  const slide = slides[idx];
  const prevSlide = slides[(idx - 1 + slides.length) % slides.length];
  const nextSlide = slides[(idx + 1) % slides.length];
  const slidesTotal = slides.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${slide}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    iframe {
      position: fixed;
      width: 1920px; height: 1080px;
      border: none;
      transform-origin: top left;
    }
    .overlay {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 12px; align-items: center;
      background: rgba(0,0,0,0.6); border-radius: 8px; padding: 8px 16px;
      backdrop-filter: blur(4px);
    }
    .overlay a, .overlay button {
      background: none; border: 1px solid #aaa; color: #eee;
      padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;
      text-decoration: none; display: inline-block;
    }
    .overlay a:hover, .overlay button:hover { background: rgba(255,255,255,0.15); }
    .overlay .counter { color: #aaa; font-size: 0.85rem; font-family: sans-serif; min-width: 60px; text-align: center; }
  </style>
</head>
<body>
  <iframe src="../slides/${slide}"></iframe>
  <div class="overlay">
    <a href="../index.html">&#8617; Gallery</a>
    <a href="${prevSlide}">&#8592;</a>
    <span class="counter">${idx + 1} / ${slidesTotal}</span>
    <a href="${nextSlide}">&#8594;</a>
  </div>
  <script>
    (function () {
      const prev = '../viewer/${prevSlide}';
      const next = '../viewer/${nextSlide}';
      document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft')  location.href = prev;
        if (e.key === 'ArrowRight') location.href = next;
      });

      function scaleViewer() {
        const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        const frame = document.querySelector('iframe');
        frame.style.transform = 'scale(' + scale + ')';
        frame.style.left = ((window.innerWidth  - 1920 * scale) / 2) + 'px';
        frame.style.top  = ((window.innerHeight - 1080 * scale) / 2) + 'px';
      }
      scaleViewer();
      window.addEventListener('resize', scaleViewer);
    }());
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

const slides = getSlides();

// Copy slides/ into docs/slides/
const destSlides = path.join(OUT, "slides");
console.log("Copying slides/ -> docs/slides/");
cpR(path.join(ROOT, "slides"), destSlides);

// Write gallery index
const galleryHtml = renderGallery(slides);
fs.writeFileSync(path.join(OUT, "index.html"), galleryHtml);
console.log("Written docs/index.html");

// Write one viewer file per slide
const viewerDir = path.join(OUT, "viewer");
fs.mkdirSync(viewerDir, { recursive: true });
for (let i = 0; i < slides.length; i++) {
  const name = slides[i];
  fs.writeFileSync(path.join(viewerDir, name), renderViewer(slides, i));
}
console.log(`Written ${slides.length} viewer files to docs/viewer/`);

console.log("Done.");
