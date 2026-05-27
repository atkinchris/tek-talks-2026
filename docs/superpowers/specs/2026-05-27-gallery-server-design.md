# Gallery Server Design

Date: 2026-05-27

## Goal

A local development tool that presents all slides in `slides/*.html` as a
browsable gallery - thumbnail grid, click-to-view, prev/next navigation - without
modifying any slide file.

## Components

### `gallery-server.js`

A single Node.js script using only built-in modules (`http`, `fs`, `path`) plus
`ws` (already a transitive dep) for live reload.

Responsibilities:

- Serve all files under the repo root as static assets (so slides and
  `slides/shared/style.css` resolve correctly inside iframes).
- Handle `GET /` by reading `slides/*.html` from disk, sorting alphabetically,
  and returning a server-side-rendered HTML page (the gallery).
- Watch `slides/` for file changes using `fs.watch`; on any change, broadcast
  a reload message over a WebSocket connection so the browser refreshes
  automatically.

No Express, no Chokidar, no new dependencies.

### Gallery page (rendered by server at `GET /`)

Rendered fresh on each request - no stale state.

**Gallery mode** (default, no `?slide=` in URL):

- Responsive grid of thumbnail cards.
- Each card contains a scaled-down `<iframe>` (CSS `transform: scale()` +
  `pointer-events: none`) showing the live HTML of that slide, with the
  filename as a caption below.
- Clicking a card navigates to `/?slide=<filename>`.

**Viewer mode** (`?slide=<filename>` present):

- Full-viewport `<iframe>` showing the selected slide.
- Overlay UI (positioned absolutely, non-intrusive): left arrow, right arrow,
  and a "back to gallery" button.
- Left/right keyboard arrows also navigate.
- Prev/next wrap around (last slide -> first, first slide -> last).
- The slide list is embedded in the page as a JS array so navigation is
  purely client-side with no server round-trip.

**Live reload** (both modes):

- Page opens a WebSocket to `ws://localhost:<port>`.
- On receiving a reload message, calls `location.reload()`.

### `npm run gallery` script

Added to `package.json`. Starts the server and prints the URL. Does not
auto-open a browser (keep it simple; user opens it once).

## Constraints

- No slide files are modified.
- No new npm dependencies.
- File list is read from disk on each `GET /` request - adding, removing, or
  renaming slides is reflected on the next page load.
- Port defaults to 3000; configurable via `PORT` env var.
