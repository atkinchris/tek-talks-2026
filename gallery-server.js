#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

function getSlides() {
  const slidesDir = path.join(ROOT, 'slides');
  return fs.readdirSync(slidesDir)
    .filter(f => f.endsWith('.html'))
    .sort();
}

function renderGallery(slides, port) {
  const cards = slides.map(slide => `
    <a class="card" href="/?slide=${encodeURIComponent(slide)}">
      <div class="thumb-wrap">
        <iframe src="/slides/${slide}" scrolling="no" tabindex="-1"></iframe>
      </div>
      <span class="caption">${slide}</span>
    </a>`).join('\n');

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
      width: 1280px; height: 720px;
      transform: scale(0.21875); transform-origin: top left;
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
    const ws = new WebSocket('ws://localhost:${port}');
    ws.onmessage = () => location.reload();
  </script>
</body>
</html>`;
}

function renderViewer(slides, slide, port) {
  return `<html><body>Viewer coming soon: ${slide}</body></html>`;
}

function serveStatic(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = reqUrl.pathname;

  if (pathname === '/') {
    const slides = getSlides();
    const slide = reqUrl.searchParams.get('slide');
    if (slide) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderViewer(slides, slide, port));  // Task 3
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderGallery(slides, PORT));
    return;
  }

  // Static files
  const filePath = path.join(ROOT, pathname);
  // Prevent path traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  serveStatic(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Gallery server running at http://localhost:${PORT}`);
});

module.exports = { server };
