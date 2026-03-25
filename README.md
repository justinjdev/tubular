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

## Tech Stack

- [SvelteKit](https://svelte.dev/) + [Svelte 5](https://svelte.dev/docs/svelte/overview)
- [Three.js](https://threejs.org/) via [Threlte](https://threlte.xyz/)
- [Tailwind CSS](https://tailwindcss.com/)
- [jsPDF](https://github.com/parallax/jsPDF) + DXF export
- Deployed to [GitHub Pages](https://pages.github.com/) via Actions

## License

MIT
