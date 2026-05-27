#!/usr/bin/env node
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { WebSocketServer } = require('ws');

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

    const ws = new WebSocket('ws://localhost:${port}');
    ws.onmessage = () => location.reload();
  </script>
</body>
</html>`;
}

function renderViewer(slides, slide, port) {
  const idx = slides.indexOf(slide);
  const safeIdx = idx === -1 ? 0 : idx;
  const slidesJson = JSON.stringify(slides);

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
    .overlay button {
      background: none; border: 1px solid #aaa; color: #eee;
      padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;
    }
    .overlay button:hover { background: rgba(255,255,255,0.15); }
    .overlay .counter { color: #aaa; font-size: 0.85rem; font-family: sans-serif; min-width: 60px; text-align: center; }
  </style>
</head>
<body>
  <iframe id="frame" src="/slides/${slide}"></iframe>
  <div class="overlay">
    <button id="btn-gallery">&#8617; Gallery</button>
    <button id="btn-prev">&#8592;</button>
    <span class="counter" id="counter"></span>
    <button id="btn-next">&#8594;</button>
  </div>
  <script>
    const slides = ${slidesJson};
    let idx = ${safeIdx};

    function navigate(newIdx) {
      idx = ((newIdx % slides.length) + slides.length) % slides.length;
      const slide = slides[idx];
      document.getElementById('frame').src = '/slides/' + slide;
      document.getElementById('counter').textContent = (idx + 1) + ' / ' + slides.length;
      history.replaceState(null, '', '/?slide=' + encodeURIComponent(slide));
    }

    document.getElementById('btn-gallery').onclick = () => { location.href = '/'; };
    document.getElementById('btn-prev').onclick = () => navigate(idx - 1);
    document.getElementById('btn-next').onclick = () => navigate(idx + 1);

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  navigate(idx - 1);
      if (e.key === 'ArrowRight') navigate(idx + 1);
    });

    navigate(idx);

    function scaleViewer() {
      const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const frame = document.getElementById('frame');
      frame.style.transform = 'scale(' + scale + ')';
      frame.style.left = ((window.innerWidth  - 1920 * scale) / 2) + 'px';
      frame.style.top  = ((window.innerHeight - 1080 * scale) / 2) + 'px';
    }
    scaleViewer();
    window.addEventListener('resize', scaleViewer);

    const ws = new WebSocket('ws://localhost:${port}');
    ws.onmessage = () => location.reload();
  </script>
</body>
</html>`;
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
      res.end(renderViewer(slides, slide, PORT));  // Task 3
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

// WebSocket server for live reload
const wss = new WebSocketServer({ server });

// Watch slides/ directory for changes
fs.watch(path.join(ROOT, 'slides'), { recursive: true }, () => {
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send('reload');
    }
  }
});

module.exports = { server };
