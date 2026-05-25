# Tek Talks 2026

Slide deck for "Let's hack a games console" - a 40-minute talk about hardware hacking for ~100 engineers.

Each slide is a standalone HTML file at 1920x1080. Puppeteer screenshots them at 4K and a second script assembles the PNGs into a PowerPoint.

## Setup

```sh
npm install
```

## Scripts

| Command | What it does |
|---|---|
| `npm run screenshot` | Exports each HTML slide to a 3840x2160 PNG in `output/` |
| `npm run pptx` | Assembles the PNGs into `output/slides.pptx` |
| `npm run build` | Runs both in sequence |
