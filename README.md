# Tubular

Interactive 3D welded steel table designer. Configure dimensions, tubing profiles, bracing, drawers, and more — then export cut lists and fabrication docs.

**[Live Demo](https://justinjdev.github.io/tubular/)**

## Features

- **3D Visualization** — Real-time preview with orbit controls, powered by Three.js and Threlte
- **Configurable Dimensions** — Length, width, height with imperial/metric toggle
- **Tubing Profiles** — Select tube or flat-bar stock for legs, frame, and bracing with various gauges
- **Bracing Options** — H-brace, X-brace, or none per side
- **Structural Reinforcement** — Corner gusset plates (per-face), center supports, shelf frame
- **Drawer System** — Per-bay drawer configuration with slide mounts
- **Cut Lists** — Auto-generated tube and drawer panel cut lists
- **Stock Nesting** — Optimized cutting patterns to minimize material waste
- **Materials Summary** — Weight and cost estimates
- **Export** — PDF (orthographic views + cut lists) and DXF (for CNC/laser)
- **Persistent Config** — Saves your design to localStorage automatically
- **Import/Export** — Share designs via URL, JSON, or file upload

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173/tubular](http://localhost:5173/tubular) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (static) |
| `npm run preview` | Preview production build |
| `npm run check` | TypeScript + Svelte type checking |
| `npm run test` | Run unit tests |

## Importing Designs

You can import a table config in three ways:

1. **Share link** — Append `?config=<base64>` to the URL
2. **JSON paste** — Click Share in the header, paste JSON into the import box
3. **File upload** — Upload a `.json` file

### Generating configs with Claude / ChatGPT

Give the LLM the [JSON schema](https://justinjdev.github.io/tubular/schema.json) and ask it to design a table. Paste the resulting JSON into Tubular's import panel.

All values are in **inches**. Only include fields you want to override — omitted fields use defaults.

### Example

```json
{
  "width": 31.5,
  "depth": 29.5,
  "height": 28.375,
  "legTube": { "width": 1, "height": 1, "thickness": 0.125, "stockType": "tube" },
  "frameTube": { "width": 1, "height": 1, "thickness": 0.065, "stockType": "tube" },
  "braceTube": { "width": 1, "height": 0.125, "thickness": 0.125, "stockType": "flat-bar" },
  "bracing": { "front": "none", "back": "x-brace", "left": "x-brace", "right": "x-brace" },
  "gussets": { "front": true, "back": true, "left": true, "right": true },
  "gussetSize": 3,
  "centerSupports": 1,
  "shelfFrame": true,
  "drawers": [
    { "drawers": [{ "height": 3 }, { "height": 10 }, { "height": 10 }] },
    { "drawers": [] }
  ]
}
```

## Tech Stack

- [SvelteKit](https://svelte.dev/) + [Svelte 5](https://svelte.dev/docs/svelte/overview)
- [Three.js](https://threejs.org/) via [Threlte](https://threlte.xyz/)
- [Tailwind CSS](https://tailwindcss.com/)
- [jsPDF](https://github.com/parallax/jsPDF) + DXF export
- Deployed to [GitHub Pages](https://pages.github.com/) via Actions

## License

MIT
