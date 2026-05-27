# Gallery Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local dev server that renders a live thumbnail gallery of all slides and lets you navigate between them in a viewer, with live reload on file changes.

**Architecture:** A single `gallery-server.js` Node script handles static file serving, SSR of the gallery page, and a WebSocket server for live reload. The gallery page is rendered fresh on each `GET /` request with the slide list read from disk. Viewer mode is pure client-side state driven by the `?slide=` query param.

**Tech Stack:** Node.js built-ins (`http`, `fs`, `path`, `url`), `ws` (transitive dep already in `node_modules`)

---

## File Structure

- Create: `gallery-server.js` - HTTP server, static file serving, SSR gallery page, WebSocket live reload
- Modify: `package.json` - add `"gallery": "node gallery-server.js"` to scripts

---

### Task 1: Static file server

**Files:**
- Create: `gallery-server.js`

- [ ] **Step 1: Create `gallery-server.js` with static file serving**

```js
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

  // Route: gallery (SSR) - handled in Task 2
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<html><body>Gallery coming soon</body></html>');
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
```

- [ ] **Step 2: Verify static serving works**

```sh
node gallery-server.js &
curl -s http://localhost:3000/slides/00-title.html | head -5
# Expected: <!DOCTYPE html> ... (first lines of 00-title.html)
kill %1
```

- [ ] **Step 3: Commit**

```sh
git add gallery-server.js
git commit -m "Add gallery server with static file serving"
```

---

### Task 2: SSR gallery page (gallery mode)

**Files:**
- Modify: `gallery-server.js` - replace the placeholder `GET /` handler with SSR

- [ ] **Step 1: Add `getSlides()` helper and `renderGallery()` to `gallery-server.js`**

Replace the `// Route: gallery (SSR) - handled in Task 2` block and add these functions before the `http.createServer` call:

```js
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
```

Then replace the `GET /` stub in `createServer`:

```js
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
```

Add a temporary stub for `renderViewer` so the server still starts:

```js
function renderViewer(slides, slide, port) {
  return `<html><body>Viewer coming soon: ${slide}</body></html>`;
}
```

- [ ] **Step 2: Verify gallery renders**

```sh
node gallery-server.js &
curl -s http://localhost:3000/ | grep 'class="card"' | wc -l
# Expected: 33 (one per slide)
kill %1
```

- [ ] **Step 3: Commit**

```sh
git add gallery-server.js
git commit -m "Add SSR gallery thumbnail grid"
```

---

### Task 3: SSR viewer page (viewer mode)

**Files:**
- Modify: `gallery-server.js` - replace `renderViewer` stub with full implementation

- [ ] **Step 1: Replace `renderViewer` stub with full implementation**

```js
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
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      border: none;
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

    const ws = new WebSocket('ws://localhost:${port}');
    ws.onmessage = () => location.reload();
  </script>
</body>
</html>`;
}
```

- [ ] **Step 2: Verify viewer renders and slide list is embedded**

```sh
node gallery-server.js &
curl -s 'http://localhost:3000/?slide=00-title.html' | grep 'const slides'
# Expected: line containing const slides = ["00-title.html","01-opening-toy.html",...];
kill %1
```

- [ ] **Step 3: Commit**

```sh
git add gallery-server.js
git commit -m "Add SSR viewer with prev/next navigation and keyboard support"
```

---

### Task 4: WebSocket live reload

**Files:**
- Modify: `gallery-server.js` - add `ws` WebSocket server, wire up `fs.watch`

- [ ] **Step 1: Add WebSocket server and file watcher**

At the top of `gallery-server.js`, add:

```js
const { WebSocketServer } = require('ws');
```

After `server.listen(...)`, add:

```js
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
```

- [ ] **Step 2: Verify WebSocket server starts without error**

```sh
node gallery-server.js &
# Expected output includes: Gallery server running at http://localhost:3000
# No crash/error
curl -s http://localhost:3000/ | grep 'new WebSocket'
# Expected: line containing new WebSocket('ws://localhost:3000')
kill %1
```

- [ ] **Step 3: Commit**

```sh
git add gallery-server.js
git commit -m "Add WebSocket live reload on slides/ file changes"
```

---

### Task 5: npm script

**Files:**
- Modify: `package.json` - add `gallery` script

- [ ] **Step 1: Add the gallery script to `package.json`**

In `package.json`, change the `"scripts"` block from:

```json
"scripts": {
  "screenshot": "node screenshot.js",
  "pptx": "node assemble-pptx.js",
  "build": "node screenshot.js && node assemble-pptx.js"
},
```

to:

```json
"scripts": {
  "screenshot": "node screenshot.js",
  "pptx": "node assemble-pptx.js",
  "build": "node screenshot.js && node assemble-pptx.js",
  "gallery": "node gallery-server.js"
},
```

- [ ] **Step 2: Verify `npm run gallery` starts the server**

```sh
npm run gallery &
sleep 1
curl -s http://localhost:3000/ | grep 'Slide Gallery'
# Expected: <title>Slide Gallery</title> or similar
kill %1
```

- [ ] **Step 3: Commit**

```sh
git add package.json
git commit -m "Add npm run gallery script"
```

---

### Task 6: Smoke test end-to-end

**Files:** none (verification only)

- [ ] **Step 1: Start server and check gallery renders all slides**

```sh
node gallery-server.js &
SLIDE_COUNT=$(curl -s http://localhost:3000/ | grep -c 'class="card"')
echo "Cards: $SLIDE_COUNT"
# Expected: 33
```

- [ ] **Step 2: Check viewer renders with embedded slide list**

```sh
VIEWER=$(curl -s 'http://localhost:3000/?slide=15-d1-win.html')
echo "$VIEWER" | grep 'const slides' | head -1
# Expected: line with const slides = [...] containing all 33 filenames
echo "$VIEWER" | grep '15-d1-win'
# Expected: at least two matches (iframe src + slides array entry)
```

- [ ] **Step 3: Check static asset serving**

```sh
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/slides/shared/style.css
# Expected: 200
kill %1
```

- [ ] **Step 4: Final commit if anything was adjusted**

```sh
git status
# If clean, nothing to do. If there are changes, git add and commit with a descriptive message.
```
