# Steel Table Editor — Design Spec

## Overview

A personal SvelteKit application with a graphical editor for designing steel-framed tables. The editor provides an interactive 3D preview, parametric controls for all dimensions and materials, and generates cut lists, materials summaries, and exportable shop drawings (PDF/DXF).

## Scope

- **In scope:** Single rectangular table design with 4 straight legs, top frame, per-side bracing (H-brace, X-brace, shelf frame), configurable tubing profiles, 3D preview, cut list, materials summary, PDF and DXF export.
- **Out of scope:** Save/load, multi-table projects, angled/splayed legs, custom member placement, backend/database, user accounts.

## Architecture

Fully client-side SPA built with SvelteKit (`adapter-static`). No backend. All state lives in a single reactive Svelte 5 store.

### Project Structure

```
steel-table-editor/
├── src/
│   ├── lib/
│   │   ├── stores/
│   │   │   └── table.svelte.ts         # Reactive table state (Svelte 5 runes)
│   │   ├── components/
│   │   │   ├── scene/                   # 3D scene components (Threlte)
│   │   │   │   ├── TableScene.svelte
│   │   │   │   ├── Leg.svelte
│   │   │   │   ├── TopFrame.svelte
│   │   │   │   ├── HBrace.svelte
│   │   │   │   ├── XBrace.svelte
│   │   │   │   └── ShelfFrame.svelte
│   │   │   ├── controls/                # Parameter controls UI
│   │   │   │   ├── DimensionControls.svelte
│   │   │   │   ├── TubingControls.svelte
│   │   │   │   └── BracingControls.svelte
│   │   │   └── output/                  # Cut list, materials, export
│   │   │       ├── CutList.svelte
│   │   │       ├── MaterialsSummary.svelte
│   │   │       └── ExportButton.svelte
│   │   ├── utils/
│   │   │   ├── geometry.ts              # Tube geometry helpers
│   │   │   ├── cut-list.ts              # Cut list computation
│   │   │   └── export.ts                # PDF/DXF generation
│   │   └── data/
│   │       └── tubing-presets.ts        # Standard tube sizes
│   └── routes/
│       └── +page.svelte                 # Single page app
```

## Data Model

```ts
type BraceType = 'none' | 'h-brace' | 'x-brace';
type Side = 'front' | 'back' | 'left' | 'right';

interface TubeProfile {
  width: number;      // outer width (inches)
  height: number;     // outer height (inches)
  thickness: number;  // wall thickness (decimal inches)
}

interface TableConfig {
  // Overall dimensions (inches)
  length: number;     // X axis
  width: number;      // Y axis
  height: number;     // Z axis

  // Tubing profiles
  legTube: TubeProfile;
  frameTube: TubeProfile;
  braceTube: TubeProfile;

  // Bracing per side (H-brace or X-brace, independent per side)
  bracing: Record<Side, BraceType>;
  braceHeight: number;  // height from ground (inches)

  // Shelf frame is independent — a full rectangle between all 4 legs
  shelfFrame: boolean;
}

// Default values for initial load
const DEFAULT_CONFIG: TableConfig = {
  length: 60,
  width: 30,
  height: 30,
  legTube: { width: 2, height: 2, thickness: 0.075 },    // 2x2 14ga
  frameTube: { width: 2, height: 2, thickness: 0.075 },   // 2x2 14ga
  braceTube: { width: 1, height: 1, thickness: 0.075 },   // 1x1 14ga
  bracing: { front: 'none', back: 'none', left: 'none', right: 'none' },
  braceHeight: 8,
  shelfFrame: false,
};
```

The entire app is driven by a single `TableConfig` reactive store. Every 3D component and output component derives from it.

## 3D Scene (Threlte + Three.js)

### Scene Setup
- Threlte `<Canvas>` with `<OrbitControls>` for rotate/zoom/pan
- Ground plane grid for spatial reference (engineering-paper style)
- Ambient + directional lighting
- Camera starts at 3/4 view angle

### Tube Rendering
- Each structural member is a `BoxGeometry` extruded to the tube's outer dimensions along its length
- Steel material: `MeshStandardMaterial` with metalness ~0.8, roughness ~0.4
- Wall thickness is not visually rendered (solid boxes) — only used for weight/materials calculations

### Component Mapping
- `Leg.svelte` — positioned at each corner, height = `tableHeight - frameTube.height`
- `TopFrame.svelte` — 4 rails forming the rectangular top, sitting on top of legs
- `HBrace.svelte` — horizontal bar between two legs at `braceHeight`
- `XBrace.svelte` — two diagonal bars forming an X between two legs. Each diagonal runs from ground level (bottom of leg) to `braceHeight`. Length = sqrt(legSpacing² + braceHeight²).
- `ShelfFrame.svelte` — 4 rails forming a rectangle between all 4 legs at `braceHeight`. Enabled/disabled independently via `shelfFrame` boolean, coexists with per-side bracing.

### Reactivity
Parameter changes in the store trigger Threlte to re-render only affected components. No manual scene management required.

## Controls Panel

### Layout
Split screen: 3D viewport ~65% on the right, controls panel ~35% on the left. Controls panel scrolls independently.

### Sections

1. **Dimensions** — number inputs with sliders for Length (X), Width (Y), Height (Z). Units in inches with display-only imperial/metric toggle (store always in inches, metric toggle converts displayed values). Range: 12"–120". Validation: braceHeight must be < height; dimensions must be > 0.

2. **Tubing** — three collapsible sections (Legs, Frame, Bracing). Each has:
   - Dropdown of standard presets (e.g., "1\" x 1\" — 14ga")
   - Expandable custom override for width/height/thickness
   - Wall thickness accepts gauge numbers (11, 14, 16) and decimal inches

3. **Bracing** — top-down diagram of the table showing 4 sides. Click a side to cycle: None → H-Brace → X-Brace. Separate toggle for shelf frame (applies to all 4 sides as a full rectangle, independent of per-side bracing). Slider for brace height from ground.

### Interactions
- All controls update the store immediately (live preview)
- Number inputs support typing and drag/scroll adjustment
- Preset selection auto-fills custom fields for tweaking

## Outputs

### Cut List
- Table of every piece: description, tube profile, length, quantity
- Grouped by section: Top Frame, Legs, Bracing
- Lengths account for joint fitment (frame rails = outer dimension minus leg tube width at corners, butt joints assumed)

### Materials Summary
- Total linear feet per tube profile
- Estimated weight: steel density (490 lb/ft³) × tube cross-section area (outer - inner)
- Optional cost estimate via user-entered $/ft per tube profile

### Export (V1)
- **PDF** — client-side via `jspdf`. Contains cut list table and materials summary. Dimensioned orthographic views are deferred to V2.
- **DXF** — client-side via `dxf-writer`. Simple 2D top-down plan view with overall dimensions. Full orthographic views deferred to V2.

Both triggered by download buttons, no server involved.

## Tech Stack

| Dependency | Purpose |
|---|---|
| SvelteKit | App framework (SPA mode, `adapter-static`) |
| Svelte 5 | Runes for reactive state |
| `@threlte/core` + `@threlte/extras` | Declarative Three.js for Svelte |
| `three` | 3D rendering (peer dep of Threlte) |
| `jspdf` | Client-side PDF generation |
| `dxf-writer` | Client-side DXF export |
| Tailwind CSS | Controls panel styling |

## Joint Assumptions

All joints are butt joints. Frame rails sit on top of legs. Long rails (length-axis) run full length; short rails (width-axis) are shortened by leg tube width at each end. Brace members fit between legs (length = leg spacing minus tube width). No miter cuts or coping in the initial version.

## Standard Tubing Presets

| Label | Width | Height | Wall Thickness | Gauge |
|---|---|---|---|---|
| 1" x 1" — 16ga | 1.0 | 1.0 | 0.065 | 16 |
| 1" x 1" — 14ga | 1.0 | 1.0 | 0.075 | 14 |
| 1" x 2" — 14ga | 1.0 | 2.0 | 0.075 | 14 |
| 1" x 2" — 11ga | 1.0 | 2.0 | 0.120 | 11 |
| 1.5" x 1.5" — 14ga | 1.5 | 1.5 | 0.075 | 14 |
| 1.5" x 1.5" — 11ga | 1.5 | 1.5 | 0.120 | 11 |
| 2" x 2" — 14ga | 2.0 | 2.0 | 0.075 | 14 |
| 2" x 2" — 11ga | 2.0 | 2.0 | 0.120 | 11 |
| 2" x 3" — 14ga | 2.0 | 3.0 | 0.075 | 14 |
| 2" x 3" — 11ga | 2.0 | 3.0 | 0.120 | 11 |
| 3" x 3" — 11ga | 3.0 | 3.0 | 0.120 | 11 |
