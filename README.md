# Tek Talks 2026

Slide deck for "Let's hack a games console" - a 40-minute talk about hardware hacking for ~100 engineers.

Each slide is a standalone HTML file at 1920x1080. Puppeteer screenshots them at 4K and a second script assembles the PNGs into a PowerPoint.

## Setup

```sh
npm install
```

## Scripts

| Command              | What it does                                            |
| -------------------- | ------------------------------------------------------- |
| `npm run gallery`    | Starts the local slide gallery (see below)              |
| `npm run screenshot` | Exports each HTML slide to a 3840x2160 PNG in `output/` |
| `npm run pptx`       | Assembles the PNGs into `output/slides.pptx`            |
| `npm run build`      | Runs both in sequence                                   |

## Gallery

The gallery server is a local dev tool for browsing and previewing slides without touching the HTML files themselves.

```sh
npm run gallery
```

Then open `http://localhost:3000` in a browser.

**Gallery view** - a grid of live thumbnail previews of every slide in `slides/`. Click any thumbnail to open it full-screen.

**Viewer** - the selected slide scaled to fit your screen, centred with letterboxing. Navigate with the on-screen arrows or the left/right keyboard keys. The counter shows your position in the deck. Click the back arrow to return to the gallery.

**Live reload** - whenever you save a file in `slides/`, the browser reloads automatically.

**Dynamic** - slides are read from disk on each page load, so adding, removing, or renaming files is reflected immediately without restarting the server.

The port defaults to 3000 and can be overridden with the `PORT` environment variable.
