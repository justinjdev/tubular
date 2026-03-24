# Steel Table Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side SvelteKit app with a 3D parametric editor for designing steel-framed tables, generating cut lists, materials summaries, and PDF/DXF exports.

**Architecture:** Single-page SPA using SvelteKit with `adapter-static`. All state in a single Svelte 5 runes store (`TableConfig`). 3D rendering via Threlte (declarative Three.js for Svelte). Split-screen layout: controls panel (35% left) + 3D viewport (65% right). Output tabs below controls for cut list, materials, and export.

**Tech Stack:** SvelteKit, Svelte 5, Threlte 8 (`@threlte/core` + `@threlte/extras`), Three.js, Tailwind CSS, jsPDF

**Axis convention:** `legTube.width` maps to X-axis, `legTube.height` maps to Z-axis. This is consistent across all components.

**Spec:** `docs/superpowers/specs/2026-03-23-steel-table-editor-design.md`

---

## File Map

| File | Responsibility |
|---|---|
| `src/lib/stores/table.svelte.ts` | Reactive `TableConfig` store with defaults, validation, derived geometry |
| `src/lib/data/tubing-presets.ts` | Standard HSS tube size presets with gauge-to-thickness mapping |
| `src/lib/utils/geometry.ts` | Shared geometry constants (steel density, axis conventions) |
| `src/lib/utils/cut-list.ts` | Generate cut list items from `TableConfig` |
| `src/lib/utils/materials.ts` | Compute linear feet, weight, cost from cut list |
| `src/lib/utils/export-pdf.ts` | PDF generation with jsPDF |
| `src/lib/utils/export-dxf.ts` | DXF generation (raw DXF text, no external dependency) |
| `src/lib/components/scene/TableScene.svelte` | Threlte Canvas, camera, lights, grid, composes all 3D components |
| `src/lib/components/scene/TubeMember.svelte` | Reusable tube mesh — takes position, dimensions, rotation |
| `src/lib/components/scene/Legs.svelte` | 4 legs positioned at corners |
| `src/lib/components/scene/TopFrame.svelte` | 4 frame rails on top of legs |
| `src/lib/components/scene/HBrace.svelte` | Horizontal stretcher between two legs on a side |
| `src/lib/components/scene/XBrace.svelte` | X-cross diagonals between two legs on a side |
| `src/lib/components/scene/ShelfFrame.svelte` | 4 rails forming lower shelf rectangle |
| `src/lib/components/controls/DimensionControls.svelte` | Length/Width/Height sliders + metric toggle |
| `src/lib/components/controls/TubingControls.svelte` | Tube profile selection per member type |
| `src/lib/components/controls/BracingControls.svelte` | Per-side brace type + shelf frame toggle + height slider |
| `src/lib/components/output/CutList.svelte` | Cut list table display |
| `src/lib/components/output/MaterialsSummary.svelte` | Totals, weight, cost display |
| `src/lib/components/output/ExportButtons.svelte` | PDF + DXF download buttons |
| `src/routes/+page.svelte` | Main page layout — split screen |
| `src/routes/+page.ts` | `export const ssr = false` |
| `src/app.css` | Global styles + Tailwind imports |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `src/app.html`, `src/app.css`, `src/routes/+page.svelte`, `src/routes/+page.ts`

- [ ] **Step 1: Scaffold SvelteKit project**

```bash
cd /Users/justin/git/tubular
npx sv create . --template minimal --types ts
```

Select: SvelteKit minimal, TypeScript, no extras. If prompted to overwrite, allow it.

- [ ] **Step 2: Install dependencies**

```bash
npm install three @threlte/core @threlte/extras
npm install -D @types/three
```

- [ ] **Step 3: Install Tailwind CSS**

```bash
npx sv add tailwindcss
```

- [ ] **Step 4: Install export dependencies**

```bash
npm install jspdf
```

- [ ] **Step 5: Configure static adapter**

```bash
npm install -D @sveltejs/adapter-static
```

Update `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		})
	},
	preprocess: vitePreprocess()
};

export default config;
```

- [ ] **Step 6: Disable SSR for the page**

Create `src/routes/+page.ts`:

```ts
export const ssr = false;
```

- [ ] **Step 7: Create minimal page to verify setup**

Replace `src/routes/+page.svelte`:

```svelte
<script>
  import { Canvas } from '@threlte/core';
</script>

<div class="h-screen w-screen bg-neutral-900">
  <Canvas>
    <!-- Scene will go here -->
  </Canvas>
</div>
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Open http://localhost:5173 — should see a dark screen with no errors in console.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold SvelteKit project with Threlte and Tailwind"
```

---

## Task 2: Data Model & Store

**Files:**
- Create: `src/lib/stores/table.svelte.ts`
- Create: `src/lib/data/tubing-presets.ts`

- [ ] **Step 1: Create tubing presets**

Create `src/lib/data/tubing-presets.ts`:

```ts
export interface TubePreset {
	label: string;
	width: number;
	height: number;
	thickness: number;
	gauge: number;
}

export const GAUGE_TO_THICKNESS: Record<number, number> = {
	16: 0.065,
	14: 0.075,
	13: 0.09,
	12: 0.105,
	11: 0.12,
	10: 0.135
};

export const TUBING_PRESETS: TubePreset[] = [
	{ label: '1" × 1" — 16ga', width: 1.0, height: 1.0, thickness: 0.065, gauge: 16 },
	{ label: '1" × 1" — 14ga', width: 1.0, height: 1.0, thickness: 0.075, gauge: 14 },
	{ label: '1" × 2" — 14ga', width: 1.0, height: 2.0, thickness: 0.075, gauge: 14 },
	{ label: '1" × 2" — 11ga', width: 1.0, height: 2.0, thickness: 0.12, gauge: 11 },
	{ label: '1.5" × 1.5" — 14ga', width: 1.5, height: 1.5, thickness: 0.075, gauge: 14 },
	{ label: '1.5" × 1.5" — 11ga', width: 1.5, height: 1.5, thickness: 0.12, gauge: 11 },
	{ label: '2" × 2" — 14ga', width: 2.0, height: 2.0, thickness: 0.075, gauge: 14 },
	{ label: '2" × 2" — 11ga', width: 2.0, height: 2.0, thickness: 0.12, gauge: 11 },
	{ label: '2" × 3" — 14ga', width: 2.0, height: 3.0, thickness: 0.075, gauge: 14 },
	{ label: '2" × 3" — 11ga', width: 2.0, height: 3.0, thickness: 0.12, gauge: 11 },
	{ label: '3" × 3" — 11ga', width: 3.0, height: 3.0, thickness: 0.12, gauge: 11 }
];
```

- [ ] **Step 2: Create table store**

Create `src/lib/stores/table.svelte.ts`:

```ts
import { TUBING_PRESETS } from '$lib/data/tubing-presets';

export type BraceType = 'none' | 'h-brace' | 'x-brace';
export type Side = 'front' | 'back' | 'left' | 'right';

export interface TubeProfile {
	width: number;
	height: number;
	thickness: number;
}

export interface TableConfig {
	length: number;
	width: number;
	height: number;
	legTube: TubeProfile;
	frameTube: TubeProfile;
	braceTube: TubeProfile;
	bracing: Record<Side, BraceType>;
	braceHeight: number;
	shelfFrame: boolean;
	metric: boolean;
}

const defaultTube = (w: number, h: number, t: number): TubeProfile => ({
	width: w,
	height: h,
	thickness: t
});

export const DEFAULT_CONFIG: TableConfig = {
	length: 60,
	width: 30,
	height: 30,
	legTube: defaultTube(2, 2, 0.075),
	frameTube: defaultTube(2, 2, 0.075),
	braceTube: defaultTube(1, 1, 0.075),
	bracing: { front: 'none', back: 'none', left: 'none', right: 'none' },
	braceHeight: 8,
	shelfFrame: false,
	metric: false
};

function createTableStore() {
	let config = $state<TableConfig>({ ...DEFAULT_CONFIG });

	return {
		get config() { return config; },
		set config(v: TableConfig) { config = v; },

		updateDimension(key: 'length' | 'width' | 'height', value: number) {
			const clamped = Math.max(12, Math.min(120, value));
			config = { ...config, [key]: clamped };
			if (key === 'height' && config.braceHeight >= clamped) {
				config = { ...config, braceHeight: clamped - 1 };
			}
		},

		updateTube(member: 'legTube' | 'frameTube' | 'braceTube', tube: TubeProfile) {
			config = { ...config, [member]: tube };
		},

		updateBracing(side: Side, type: BraceType) {
			config = {
				...config,
				bracing: { ...config.bracing, [side]: type }
			};
		},

		updateBraceHeight(value: number) {
			const clamped = Math.max(1, Math.min(config.height - 1, value));
			config = { ...config, braceHeight: clamped };
		},

		toggleShelfFrame() {
			config = { ...config, shelfFrame: !config.shelfFrame };
		},

		toggleMetric() {
			config = { ...config, metric: !config.metric };
		}
	};
}

export const tableStore = createTableStore();
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/stores/table.svelte.ts src/lib/data/tubing-presets.ts
git commit -m "feat: add table config store and tubing presets"
```

---

## Task 3: Reusable TubeMember + 3D Scene Shell

**Files:**
- Create: `src/lib/components/scene/TubeMember.svelte`
- Create: `src/lib/components/scene/TableScene.svelte`

- [ ] **Step 1: Create TubeMember component**

This is the reusable building block — a steel tube rendered as a box mesh.

Create `src/lib/components/scene/TubeMember.svelte`:

```svelte
<script lang="ts">
	import { T } from '@threlte/core';

	interface Props {
		/** Box dimensions [x, y, z] in inches */
		size: [number, number, number];
		/** World position [x, y, z] */
		position?: [number, number, number];
		/** Euler rotation [x, y, z] in radians */
		rotation?: [number, number, number];
		color?: string;
	}

	let {
		size,
		position = [0, 0, 0],
		rotation = [0, 0, 0],
		color = '#708090'
	}: Props = $props();
</script>

<T.Mesh {position} {rotation}>
	<T.BoxGeometry args={size} />
	<T.MeshStandardMaterial
		{color}
		metalness={0.8}
		roughness={0.4}
	/>
</T.Mesh>
```

- [ ] **Step 2: Create TableScene shell**

Create `src/lib/components/scene/TableScene.svelte`:

```svelte
<script lang="ts">
	import { T, Canvas } from '@threlte/core';
	import { OrbitControls, Grid } from '@threlte/extras';
	import TubeMember from './TubeMember.svelte';
	import { tableStore } from '$lib/stores/table.svelte';

	// Scale factor: 1 inch = 1 Three.js unit
	// We'll work in inches throughout

	const config = $derived(tableStore.config);
</script>

<Canvas shadows>
	<!-- Camera -->
	<T.PerspectiveCamera
		makeDefault
		position={[80, 60, 80]}
		fov={45}
		oncreate={(ref) => ref.lookAt(0, 15, 0)}
	>
		<OrbitControls
			enableDamping
			target={[0, 15, 0]}
		/>
	</T.PerspectiveCamera>

	<!-- Lighting -->
	<T.AmbientLight intensity={0.4} />
	<T.DirectionalLight
		position={[50, 80, 50]}
		intensity={1.0}
		castShadow
	/>

	<!-- Ground grid -->
	<Grid
		cellColor="#444444"
		sectionColor="#666666"
		sectionSize={12}
		cellSize={1}
		fadeDistance={200}
		infiniteGrid
	/>

	<!-- Test cube to verify scene works — will be replaced by table components -->
	<TubeMember
		size={[config.length, config.frameTube.height, config.width]}
		position={[0, config.height, 0]}
	/>
</Canvas>
```

- [ ] **Step 3: Wire into page**

Update `src/routes/+page.svelte`:

```svelte
<script>
	import TableScene from '$lib/components/scene/TableScene.svelte';
</script>

<div class="h-screen w-screen bg-neutral-900">
	<TableScene />
</div>
```

- [ ] **Step 4: Verify — dev server shows a rotating 3D box on a grid**

```bash
npm run dev
```

Open http://localhost:5173 — should see a steel-colored box on a grid that you can orbit around.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/scene/ src/routes/+page.svelte
git commit -m "feat: add TubeMember component and 3D scene shell"
```

---

## Task 4: Table Geometry — Legs + Top Frame

**Files:**
- Create: `src/lib/components/scene/Legs.svelte`
- Create: `src/lib/components/scene/TopFrame.svelte`
- Modify: `src/lib/components/scene/TableScene.svelte`

- [ ] **Step 1: Create Legs component**

Create `src/lib/components/scene/Legs.svelte`:

```svelte
<script lang="ts">
	import TubeMember from './TubeMember.svelte';
	import { tableStore } from '$lib/stores/table.svelte';

	const config = $derived(tableStore.config);

	// Leg height = table height minus frame tube height (frame sits on top)
	const legHeight = $derived(config.height - config.frameTube.height);

	// Leg positions: 4 corners. Legs are inset by half their own width.
	// Table is centered at origin on X/Z, legs go from y=0 to y=legHeight.
	const halfLength = $derived(config.length / 2 - config.legTube.width / 2);
	const halfWidth = $derived(config.width / 2 - config.legTube.height / 2);
	const centerY = $derived(legHeight / 2);

	const positions = $derived<[number, number, number][]>([
		[-halfLength, centerY, -halfWidth],
		[halfLength, centerY, -halfWidth],
		[halfLength, centerY, halfWidth],
		[-halfLength, centerY, halfWidth]
	]);
</script>

{#each positions as pos}
	<TubeMember
		size={[config.legTube.width, legHeight, config.legTube.height]}
		position={pos}
	/>
{/each}
```

- [ ] **Step 2: Create TopFrame component**

Create `src/lib/components/scene/TopFrame.svelte`:

```svelte
<script lang="ts">
	import TubeMember from './TubeMember.svelte';
	import { tableStore } from '$lib/stores/table.svelte';

	const config = $derived(tableStore.config);

	// Frame sits on top of legs
	const frameY = $derived(config.height - config.frameTube.height / 2);
	const ft = $derived(config.frameTube);
	const lt = $derived(config.legTube);

	// Long rails (length-axis) run full table length
	const longRailLength = $derived(config.length);
	// Short rails (width-axis) are shortened by leg tube width at each end
	const shortRailLength = $derived(config.width - lt.width * 2);

	const halfWidth = $derived(config.width / 2 - lt.height / 2);
	const halfLength = $derived(config.length / 2 - lt.width / 2);
</script>

<!-- Long rails (front and back, along X axis) -->
<TubeMember
	size={[longRailLength, ft.height, ft.width]}
	position={[0, frameY, -halfWidth]}
/>
<TubeMember
	size={[longRailLength, ft.height, ft.width]}
	position={[0, frameY, halfWidth]}
/>

<!-- Short rails (left and right, along Z axis) -->
<TubeMember
	size={[ft.width, ft.height, shortRailLength]}
	position={[-halfLength, frameY, 0]}
/>
<TubeMember
	size={[ft.width, ft.height, shortRailLength]}
	position={[halfLength, frameY, 0]}
/>
```

- [ ] **Step 3: Update TableScene to use Legs + TopFrame**

In `src/lib/components/scene/TableScene.svelte`, replace the test cube with:

```svelte
<!-- Replace the TubeMember test cube with: -->
<Legs />
<TopFrame />
```

Add imports for `Legs` and `TopFrame`. Remove the test `TubeMember` import if no longer used directly.

- [ ] **Step 4: Verify — table frame with 4 legs renders in 3D**

```bash
npm run dev
```

Should see a rectangular frame on 4 legs. Orbit around to confirm geometry looks correct.

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/scene/
git commit -m "feat: add legs and top frame 3D components"
```

---

## Task 5: Bracing Components

**Files:**
- Create: `src/lib/components/scene/HBrace.svelte`
- Create: `src/lib/components/scene/XBrace.svelte`
- Create: `src/lib/components/scene/ShelfFrame.svelte`
- Create: `src/lib/components/scene/Bracing.svelte`
- Modify: `src/lib/components/scene/TableScene.svelte`

- [ ] **Step 1: Create HBrace component**

Create `src/lib/components/scene/HBrace.svelte`:

```svelte
<script lang="ts">
	import TubeMember from './TubeMember.svelte';
	import { tableStore } from '$lib/stores/table.svelte';
	import type { Side } from '$lib/stores/table.svelte';

	interface Props {
		side: Side;
	}

	let { side }: Props = $props();

	const config = $derived(tableStore.config);
	const bt = $derived(config.braceTube);
	const lt = $derived(config.legTube);

	// Brace center Y position
	const centerY = $derived(config.braceHeight);

	// Compute position and size based on side
	const halfLength = $derived(config.length / 2 - lt.width / 2);
	const halfWidth = $derived(config.width / 2 - lt.height / 2);

	// Span between legs (minus tube width for fitment)
	const longSpan = $derived(config.length - lt.width * 2);
	const shortSpan = $derived(config.width - lt.height * 2);

	const geometry = $derived.by(() => {
		switch (side) {
			case 'front':
				return {
					size: [longSpan, bt.height, bt.width] as [number, number, number],
					position: [0, centerY, -halfWidth] as [number, number, number]
				};
			case 'back':
				return {
					size: [longSpan, bt.height, bt.width] as [number, number, number],
					position: [0, centerY, halfWidth] as [number, number, number]
				};
			case 'left':
				return {
					size: [bt.width, bt.height, shortSpan] as [number, number, number],
					position: [-halfLength, centerY, 0] as [number, number, number]
				};
			case 'right':
				return {
					size: [bt.width, bt.height, shortSpan] as [number, number, number],
					position: [halfLength, centerY, 0] as [number, number, number]
				};
		}
	});
</script>

<TubeMember size={geometry.size} position={geometry.position} />
```

- [ ] **Step 2: Create XBrace component**

Create `src/lib/components/scene/XBrace.svelte`:

```svelte
<script lang="ts">
	import TubeMember from './TubeMember.svelte';
	import { tableStore } from '$lib/stores/table.svelte';
	import type { Side } from '$lib/stores/table.svelte';

	interface Props {
		side: Side;
	}

	let { side }: Props = $props();

	const config = $derived(tableStore.config);
	const bt = $derived(config.braceTube);
	const lt = $derived(config.legTube);

	const halfLength = $derived(config.length / 2 - lt.width / 2);
	const halfWidth = $derived(config.width / 2 - lt.height / 2);

	const longSpan = $derived(config.length - lt.width * 2);
	const shortSpan = $derived(config.width - lt.height * 2);

	// X-brace: two diagonals from ground to braceHeight.
	// Visual approximation: both diagonals centered at midpoint with opposite rotations.
	// This creates a correct X shape; endpoints are slightly imprecise at tube intersections
	// but acceptable for preview. Cut list uses exact diagonal length formula.
	const geometry = $derived.by(() => {
		const h = config.braceHeight;
		const isLongSide = side === 'front' || side === 'back';
		const span = isLongSide ? longSpan : shortSpan;
		const diagLength = Math.sqrt(span * span + h * h);
		const angle = Math.atan2(h, span);

		// Z position for front/back, X position for left/right
		const sideOffset = (() => {
			switch (side) {
				case 'front': return { axis: 'z' as const, value: -halfWidth };
				case 'back': return { axis: 'z' as const, value: halfWidth };
				case 'left': return { axis: 'x' as const, value: -halfLength };
				case 'right': return { axis: 'x' as const, value: halfLength };
			}
		})();

		const centerY = h / 2;

		if (isLongSide) {
			return [
				{
					size: [diagLength, bt.height, bt.width] as [number, number, number],
					position: [0, centerY, sideOffset.value] as [number, number, number],
					rotation: [0, 0, angle] as [number, number, number]
				},
				{
					size: [diagLength, bt.height, bt.width] as [number, number, number],
					position: [0, centerY, sideOffset.value] as [number, number, number],
					rotation: [0, 0, -angle] as [number, number, number]
				}
			];
		} else {
			return [
				{
					size: [bt.width, bt.height, diagLength] as [number, number, number],
					position: [sideOffset.value, centerY, 0] as [number, number, number],
					rotation: [angle, 0, 0] as [number, number, number]
				},
				{
					size: [bt.width, bt.height, diagLength] as [number, number, number],
					position: [sideOffset.value, centerY, 0] as [number, number, number],
					rotation: [-angle, 0, 0] as [number, number, number]
				}
			];
		}
	});
</script>

{#each geometry as diag}
	<TubeMember size={diag.size} position={diag.position} rotation={diag.rotation} />
{/each}
```

- [ ] **Step 3: Create ShelfFrame component**

Create `src/lib/components/scene/ShelfFrame.svelte`:

```svelte
<script lang="ts">
	import TubeMember from './TubeMember.svelte';
	import { tableStore } from '$lib/stores/table.svelte';

	const config = $derived(tableStore.config);
	const bt = $derived(config.braceTube);
	const lt = $derived(config.legTube);
	const y = $derived(config.braceHeight);

	const halfLength = $derived(config.length / 2 - lt.width / 2);
	const halfWidth = $derived(config.width / 2 - lt.height / 2);

	const longSpan = $derived(config.length - lt.width * 2);
	const shortSpan = $derived(config.width - lt.height * 2);
</script>

<!-- Long rails (along X) -->
<TubeMember
	size={[longSpan, bt.height, bt.width]}
	position={[0, y, -halfWidth]}
/>
<TubeMember
	size={[longSpan, bt.height, bt.width]}
	position={[0, y, halfWidth]}
/>

<!-- Short rails (along Z) -->
<TubeMember
	size={[bt.width, bt.height, shortSpan]}
	position={[-halfLength, y, 0]}
/>
<TubeMember
	size={[bt.width, bt.height, shortSpan]}
	position={[halfLength, y, 0]}
/>
```

- [ ] **Step 4: Create Bracing orchestrator component**

Create `src/lib/components/scene/Bracing.svelte`:

```svelte
<script lang="ts">
	import HBrace from './HBrace.svelte';
	import XBrace from './XBrace.svelte';
	import ShelfFrame from './ShelfFrame.svelte';
	import { tableStore } from '$lib/stores/table.svelte';
	import type { Side } from '$lib/stores/table.svelte';

	const config = $derived(tableStore.config);
	const sides: Side[] = ['front', 'back', 'left', 'right'];
</script>

{#each sides as side}
	{#if config.bracing[side] === 'h-brace'}
		<HBrace {side} />
	{:else if config.bracing[side] === 'x-brace'}
		<XBrace {side} />
	{/if}
{/each}

{#if config.shelfFrame}
	<ShelfFrame />
{/if}
```

- [ ] **Step 5: Update TableScene**

In `src/lib/components/scene/TableScene.svelte`, add `Bracing` import and render it after `<TopFrame />`:

```svelte
<Legs />
<TopFrame />
<Bracing />
```

- [ ] **Step 6: Temporarily hardcode some bracing to verify**

In the browser console or by temporarily editing the store defaults, set `bracing.front` to `'h-brace'` and `shelfFrame` to `true`. Verify both render correctly in the 3D view.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/scene/
git commit -m "feat: add H-brace, X-brace, shelf frame, and bracing orchestrator"
```

---

## Task 6: Controls Panel — Dimensions

**Files:**
- Create: `src/lib/components/controls/DimensionControls.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create DimensionControls**

Create `src/lib/components/controls/DimensionControls.svelte`:

```svelte
<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';

	const config = $derived(tableStore.config);

	const dims = [
		{ key: 'length' as const, label: 'Length (X)', unit: 'in' },
		{ key: 'width' as const, label: 'Width (Y)', unit: 'in' },
		{ key: 'height' as const, label: 'Height (Z)', unit: 'in' }
	];

	function toDisplay(inches: number): number {
		return config.metric ? Math.round(inches * 25.4 * 10) / 10 : inches;
	}

	function unitLabel(): string {
		return config.metric ? 'mm' : 'in';
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Dimensions</h3>
		<button
			class="rounded px-2 py-0.5 text-xs text-neutral-400 ring-1 ring-neutral-600 hover:text-white"
			onclick={() => tableStore.toggleMetric()}
		>
			{config.metric ? 'Metric' : 'Imperial'}
		</button>
	</div>

	{#each dims as dim}
		<div>
			<label class="mb-1 flex items-center justify-between text-xs text-neutral-400">
				<span>{dim.label}</span>
				<div class="flex items-center gap-1">
					<input
						type="number"
						min="12"
						max="120"
						step="1"
						value={config[dim.key]}
						oninput={(e) => tableStore.updateDimension(dim.key, Number(e.currentTarget.value))}
						class="w-16 rounded bg-neutral-700 px-1.5 py-0.5 text-right text-sm text-white"
					/>
					<span>{unitLabel()}</span>
				</div>
			</label>
			<input
				type="range"
				min="12"
				max="120"
				step="1"
				value={config[dim.key]}
				oninput={(e) => tableStore.updateDimension(dim.key, Number(e.currentTarget.value))}
				class="w-full accent-amber-500"
			/>
		</div>
	{/each}
</div>
```

- [ ] **Step 2: Create split-screen page layout**

Update `src/routes/+page.svelte`:

```svelte
<script>
	import TableScene from '$lib/components/scene/TableScene.svelte';
	import DimensionControls from '$lib/components/controls/DimensionControls.svelte';
</script>

<div class="flex h-screen w-screen bg-neutral-900 text-white">
	<!-- Controls Panel -->
	<aside class="w-[35%] min-w-[320px] overflow-y-auto border-r border-neutral-700 p-6">
		<h1 class="mb-6 text-lg font-bold tracking-tight">Tubular</h1>
		<DimensionControls />
	</aside>

	<!-- 3D Viewport -->
	<main class="flex-1">
		<TableScene />
	</main>
</div>
```

- [ ] **Step 3: Verify — sliders update the 3D table in real time**

```bash
npm run dev
```

Drag the Length/Width/Height sliders and confirm the 3D table resizes live.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/controls/ src/routes/+page.svelte
git commit -m "feat: add dimension controls with live 3D preview"
```

---

## Task 7: Controls Panel — Tubing

**Files:**
- Create: `src/lib/components/controls/TubingControls.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create TubingControls**

Create `src/lib/components/controls/TubingControls.svelte`:

```svelte
<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { TUBING_PRESETS, GAUGE_TO_THICKNESS, type TubePreset } from '$lib/data/tubing-presets';
	import type { TubeProfile } from '$lib/stores/table.svelte';

	const config = $derived(tableStore.config);

	type MemberKey = 'legTube' | 'frameTube' | 'braceTube';

	const members: { key: MemberKey; label: string }[] = [
		{ key: 'legTube', label: 'Legs' },
		{ key: 'frameTube', label: 'Frame' },
		{ key: 'braceTube', label: 'Bracing' }
	];

	let expanded = $state<MemberKey | null>(null);

	function findPresetIndex(tube: TubeProfile): number {
		return TUBING_PRESETS.findIndex(
			(p) => p.width === tube.width && p.height === tube.height && p.thickness === tube.thickness
		);
	}

	function selectPreset(member: MemberKey, preset: TubePreset) {
		tableStore.updateTube(member, {
			width: preset.width,
			height: preset.height,
			thickness: preset.thickness
		});
	}

	function updateCustomField(member: MemberKey, field: keyof TubeProfile, value: number) {
		const current = config[member];
		tableStore.updateTube(member, { ...current, [field]: value });
	}
</script>

<div class="space-y-4">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Tubing</h3>

	{#each members as member}
		{@const tube = config[member.key]}
		{@const presetIdx = findPresetIndex(tube)}

		<div class="rounded-lg bg-neutral-800 p-3">
			<button
				class="flex w-full items-center justify-between text-sm font-medium"
				onclick={() => expanded = expanded === member.key ? null : member.key}
			>
				<span>{member.label}</span>
				<span class="text-xs text-neutral-400">
					{presetIdx >= 0 ? TUBING_PRESETS[presetIdx].label : 'Custom'}
				</span>
			</button>

			{#if expanded === member.key}
				<div class="mt-3 space-y-2">
					<select
						class="w-full rounded bg-neutral-700 px-2 py-1.5 text-sm"
						value={presetIdx}
						onchange={(e) => {
							const idx = Number(e.currentTarget.value);
							if (idx >= 0) selectPreset(member.key, TUBING_PRESETS[idx]);
						}}
					>
						<option value={-1}>Custom</option>
						{#each TUBING_PRESETS as preset, i}
							<option value={i}>{preset.label}</option>
						{/each}
					</select>

					<div class="grid grid-cols-3 gap-2">
						<label class="text-xs text-neutral-400">
							Width"
							<input
								type="number"
								step="0.125"
								min="0.5"
								max="6"
								value={tube.width}
								oninput={(e) => updateCustomField(member.key, 'width', Number(e.currentTarget.value))}
								class="mt-0.5 w-full rounded bg-neutral-700 px-2 py-1 text-sm"
							/>
						</label>
						<label class="text-xs text-neutral-400">
							Height"
							<input
								type="number"
								step="0.125"
								min="0.5"
								max="6"
								value={tube.height}
								oninput={(e) => updateCustomField(member.key, 'height', Number(e.currentTarget.value))}
								class="mt-0.5 w-full rounded bg-neutral-700 px-2 py-1 text-sm"
							/>
						</label>
						<label class="text-xs text-neutral-400">
							Wall
							<select
								class="mt-0.5 w-full rounded bg-neutral-700 px-2 py-1 text-sm"
								value={Object.entries(GAUGE_TO_THICKNESS).find(([, t]) => t === tube.thickness)?.[0] ?? 'custom'}
								onchange={(e) => {
									const val = e.currentTarget.value;
									if (val !== 'custom') {
										updateCustomField(member.key, 'thickness', GAUGE_TO_THICKNESS[Number(val)]);
									}
								}}
							>
								{#each Object.entries(GAUGE_TO_THICKNESS) as [gauge, t]}
									<option value={gauge}>{gauge}ga ({t}")</option>
								{/each}
								<option value="custom">Custom</option>
							</select>
							<input
								type="number"
								step="0.005"
								min="0.035"
								max="0.5"
								value={tube.thickness}
								oninput={(e) => updateCustomField(member.key, 'thickness', Number(e.currentTarget.value))}
								class="mt-0.5 w-full rounded bg-neutral-700 px-2 py-1 text-sm"
							/>
						</label>
					</div>
				</div>
			{/if}
		</div>
	{/each}
</div>
```

- [ ] **Step 2: Add TubingControls to page**

In `src/routes/+page.svelte`, import `TubingControls` and add it below `<DimensionControls />`:

```svelte
<div class="mt-6">
	<TubingControls />
</div>
```

- [ ] **Step 3: Verify — changing tube sizes updates 3D model**

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/controls/TubingControls.svelte src/routes/+page.svelte
git commit -m "feat: add tubing profile controls with presets"
```

---

## Task 8: Controls Panel — Bracing

**Files:**
- Create: `src/lib/components/controls/BracingControls.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create BracingControls**

Create `src/lib/components/controls/BracingControls.svelte`:

```svelte
<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import type { Side, BraceType } from '$lib/stores/table.svelte';

	const config = $derived(tableStore.config);

	const sides: { key: Side; label: string }[] = [
		{ key: 'front', label: 'Front' },
		{ key: 'back', label: 'Back' },
		{ key: 'left', label: 'Left' },
		{ key: 'right', label: 'Right' }
	];

	const braceTypes: BraceType[] = ['none', 'h-brace', 'x-brace'];

	function cycleBrace(side: Side) {
		const current = config.bracing[side];
		const idx = braceTypes.indexOf(current);
		const next = braceTypes[(idx + 1) % braceTypes.length];
		tableStore.updateBracing(side, next);
	}

	function braceLabel(type: BraceType): string {
		switch (type) {
			case 'none': return '—';
			case 'h-brace': return 'H';
			case 'x-brace': return 'X';
		}
	}

	function braceColor(type: BraceType): string {
		switch (type) {
			case 'none': return 'bg-neutral-700';
			case 'h-brace': return 'bg-amber-700';
			case 'x-brace': return 'bg-blue-700';
		}
	}
</script>

<div class="space-y-4">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Bracing</h3>

	<!-- Top-down table diagram -->
	<div class="relative mx-auto aspect-[2/1] w-full max-w-[240px]">
		<!-- Table outline -->
		<div class="absolute inset-4 border-2 border-neutral-500 rounded">
			<!-- Corner dots -->
			{#each [[0,0],[100,0],[100,100],[0,100]] as [x, y]}
				<div
					class="absolute h-2 w-2 rounded-full bg-neutral-400 -translate-x-1 -translate-y-1"
					style="left: {x}%; top: {y}%"
				></div>
			{/each}
		</div>

		<!-- Side buttons -->
		<!-- Front (top edge) -->
		<button
			class="absolute left-1/2 top-0 -translate-x-1/2 rounded px-3 py-0.5 text-xs font-mono {braceColor(config.bracing.front)}"
			onclick={() => cycleBrace('front')}
		>
			{braceLabel(config.bracing.front)}
		</button>
		<!-- Back (bottom edge) -->
		<button
			class="absolute left-1/2 bottom-0 -translate-x-1/2 rounded px-3 py-0.5 text-xs font-mono {braceColor(config.bracing.back)}"
			onclick={() => cycleBrace('back')}
		>
			{braceLabel(config.bracing.back)}
		</button>
		<!-- Left -->
		<button
			class="absolute left-0 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-xs font-mono {braceColor(config.bracing.left)}"
			onclick={() => cycleBrace('left')}
		>
			{braceLabel(config.bracing.left)}
		</button>
		<!-- Right -->
		<button
			class="absolute right-0 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-xs font-mono {braceColor(config.bracing.right)}"
			onclick={() => cycleBrace('right')}
		>
			{braceLabel(config.bracing.right)}
		</button>
	</div>

	<p class="text-center text-xs text-neutral-500">Click a side to cycle: — → H → X</p>

	<!-- Shelf frame toggle -->
	<label class="flex items-center gap-2 text-sm">
		<input
			type="checkbox"
			checked={config.shelfFrame}
			onchange={() => tableStore.toggleShelfFrame()}
			class="accent-amber-500"
		/>
		Lower shelf frame
	</label>

	<!-- Brace height slider -->
	<div>
		<label class="mb-1 flex justify-between text-xs text-neutral-400">
			<span>Brace Height</span>
			<span>{config.braceHeight}"</span>
		</label>
		<input
			type="range"
			min="1"
			max={config.height - 1}
			step="0.5"
			value={config.braceHeight}
			oninput={(e) => tableStore.updateBraceHeight(Number(e.currentTarget.value))}
			class="w-full accent-amber-500"
		/>
	</div>
</div>
```

- [ ] **Step 2: Add BracingControls to page**

In `src/routes/+page.svelte`, import `BracingControls` and add below tubing controls:

```svelte
<div class="mt-6">
	<BracingControls />
</div>
```

- [ ] **Step 3: Verify — clicking sides cycles bracing, shelf toggle works, height slider works**

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/controls/BracingControls.svelte src/routes/+page.svelte
git commit -m "feat: add bracing controls with top-down diagram"
```

---

## Task 9: Cut List Computation

**Files:**
- Create: `src/lib/utils/cut-list.ts`
- Create: `src/lib/utils/cut-list.test.ts`

- [ ] **Step 1: Write failing test for cut list**

Create `src/lib/utils/cut-list.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeCutList, type CutListItem } from './cut-list';
import { DEFAULT_CONFIG } from '$lib/stores/table.svelte';

describe('computeCutList', () => {
	it('generates legs with correct height', () => {
		const items = computeCutList(DEFAULT_CONFIG);
		const legs = items.find((i) => i.group === 'Legs');
		expect(legs).toBeDefined();
		expect(legs!.quantity).toBe(4);
		// height 30 - frame tube height 2 = 28
		expect(legs!.length).toBe(28);
	});

	it('generates long frame rails at full table length', () => {
		const items = computeCutList(DEFAULT_CONFIG);
		const longRails = items.find((i) => i.description === 'Top Frame — Long Rail');
		expect(longRails).toBeDefined();
		expect(longRails!.quantity).toBe(2);
		expect(longRails!.length).toBe(60); // full length
	});

	it('generates short frame rails shortened by leg width', () => {
		const items = computeCutList(DEFAULT_CONFIG);
		const shortRails = items.find((i) => i.description === 'Top Frame — Short Rail');
		expect(shortRails).toBeDefined();
		expect(shortRails!.quantity).toBe(2);
		// width 30 - (2 * leg tube width 2) = 26
		expect(shortRails!.length).toBe(26);
	});

	it('includes h-brace when configured', () => {
		const config = {
			...DEFAULT_CONFIG,
			bracing: { ...DEFAULT_CONFIG.bracing, front: 'h-brace' as const }
		};
		const items = computeCutList(config);
		const brace = items.find((i) => i.description === 'H-Brace — Front');
		expect(brace).toBeDefined();
		expect(brace!.quantity).toBe(1);
		// longSpan = 60 - 2*2 = 56
		expect(brace!.length).toBe(56);
	});

	it('includes x-brace diagonals when configured', () => {
		const config = {
			...DEFAULT_CONFIG,
			bracing: { ...DEFAULT_CONFIG.bracing, left: 'x-brace' as const }
		};
		const items = computeCutList(config);
		const brace = items.find((i) => i.description === 'X-Brace — Left');
		expect(brace).toBeDefined();
		expect(brace!.quantity).toBe(2);
		// shortSpan = 30 - 2*2 = 26, height = 8
		// diagonal = sqrt(26^2 + 8^2) = sqrt(676 + 64) = sqrt(740) ≈ 27.2
		expect(brace!.length).toBeCloseTo(Math.sqrt(26 * 26 + 8 * 8), 1);
	});

	it('includes shelf frame when enabled', () => {
		const config = { ...DEFAULT_CONFIG, shelfFrame: true };
		const items = computeCutList(config);
		const longShelf = items.find((i) => i.description === 'Shelf Frame — Long Rail');
		const shortShelf = items.find((i) => i.description === 'Shelf Frame — Short Rail');
		expect(longShelf).toBeDefined();
		expect(shortShelf).toBeDefined();
		expect(longShelf!.quantity).toBe(2);
		expect(shortShelf!.quantity).toBe(2);
	});

	it('returns empty bracing items when no bracing configured', () => {
		const items = computeCutList(DEFAULT_CONFIG);
		const braceItems = items.filter((i) => i.group === 'Bracing');
		expect(braceItems).toHaveLength(0);
	});
});
```

- [ ] **Step 2: Install vitest and run test to verify it fails**

```bash
npm install -D vitest
```

Update `vite.config.ts` to add vitest config and `$lib` alias:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.test.ts'],
		alias: {
			'$lib': '/src/lib'
		}
	}
});
```

Then:

```bash
npx vitest run src/lib/utils/cut-list.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement cut-list.ts**

Create `src/lib/utils/cut-list.ts`:

```ts
import type { TableConfig, Side } from '$lib/stores/table.svelte';

export interface CutListItem {
	group: 'Top Frame' | 'Legs' | 'Bracing';
	description: string;
	tubeLabel: string;
	width: number;
	height: number;
	thickness: number;
	length: number;
	quantity: number;
}

function tubeLabel(w: number, h: number, t: number): string {
	return `${w}" × ${h}" (${t}")`;
}

export function computeCutList(config: TableConfig): CutListItem[] {
	const items: CutListItem[] = [];
	const { legTube: lt, frameTube: ft, braceTube: bt } = config;

	// Legs
	const legHeight = config.height - ft.height;
	items.push({
		group: 'Legs',
		description: 'Leg',
		tubeLabel: tubeLabel(lt.width, lt.height, lt.thickness),
		width: lt.width,
		height: lt.height,
		thickness: lt.thickness,
		length: legHeight,
		quantity: 4
	});

	// Top frame — long rails (full length)
	items.push({
		group: 'Top Frame',
		description: 'Top Frame — Long Rail',
		tubeLabel: tubeLabel(ft.width, ft.height, ft.thickness),
		width: ft.width,
		height: ft.height,
		thickness: ft.thickness,
		length: config.length,
		quantity: 2
	});

	// Top frame — short rails (shortened by leg width)
	const shortRailLength = config.width - lt.width * 2;
	items.push({
		group: 'Top Frame',
		description: 'Top Frame — Short Rail',
		tubeLabel: tubeLabel(ft.width, ft.height, ft.thickness),
		width: ft.width,
		height: ft.height,
		thickness: ft.thickness,
		length: shortRailLength,
		quantity: 2
	});

	// Per-side bracing
	const sides: Side[] = ['front', 'back', 'left', 'right'];
	for (const side of sides) {
		const braceType = config.bracing[side];
		if (braceType === 'none') continue;

		const isLong = side === 'front' || side === 'back';
		const span = isLong
			? config.length - lt.width * 2
			: config.width - lt.height * 2;

		const sideLabel = side.charAt(0).toUpperCase() + side.slice(1);

		if (braceType === 'h-brace') {
			items.push({
				group: 'Bracing',
				description: `H-Brace — ${sideLabel}`,
				tubeLabel: tubeLabel(bt.width, bt.height, bt.thickness),
				width: bt.width,
				height: bt.height,
				thickness: bt.thickness,
				length: span,
				quantity: 1
			});
		} else if (braceType === 'x-brace') {
			const diagLength = Math.sqrt(span * span + config.braceHeight * config.braceHeight);
			items.push({
				group: 'Bracing',
				description: `X-Brace — ${sideLabel}`,
				tubeLabel: tubeLabel(bt.width, bt.height, bt.thickness),
				width: bt.width,
				height: bt.height,
				thickness: bt.thickness,
				length: diagLength,
				quantity: 2
			});
		}
	}

	// Shelf frame
	if (config.shelfFrame) {
		const longSpan = config.length - lt.width * 2;
		const shortSpan = config.width - lt.height * 2;

		items.push({
			group: 'Bracing',
			description: 'Shelf Frame — Long Rail',
			tubeLabel: tubeLabel(bt.width, bt.height, bt.thickness),
			width: bt.width,
			height: bt.height,
			thickness: bt.thickness,
			length: longSpan,
			quantity: 2
		});

		items.push({
			group: 'Bracing',
			description: 'Shelf Frame — Short Rail',
			tubeLabel: tubeLabel(bt.width, bt.height, bt.thickness),
			width: bt.width,
			height: bt.height,
			thickness: bt.thickness,
			length: shortSpan,
			quantity: 2
		});
	}

	return items;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/utils/cut-list.test.ts
```

Expected: all 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/cut-list.ts src/lib/utils/cut-list.test.ts
git commit -m "feat: add cut list computation with tests"
```

---

## Task 10: Materials Summary Computation

**Files:**
- Create: `src/lib/utils/materials.ts`
- Create: `src/lib/utils/materials.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/utils/materials.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeMaterials, type MaterialsSummary } from './materials';
import type { CutListItem } from './cut-list';

describe('computeMaterials', () => {
	const items: CutListItem[] = [
		{
			group: 'Legs',
			description: 'Leg',
			tubeLabel: '2" × 2" (0.075")',
			width: 2,
			height: 2,
			thickness: 0.075,
			length: 28,
			quantity: 4
		},
		{
			group: 'Top Frame',
			description: 'Top Frame — Long Rail',
			tubeLabel: '2" × 2" (0.075")',
			width: 2,
			height: 2,
			thickness: 0.075,
			length: 60,
			quantity: 2
		}
	];

	it('computes total linear inches per tube profile', () => {
		const result = computeMaterials(items);
		// Legs: 28*4=112, Rails: 60*2=120 → total 232 inches
		const profile = result.byProfile[0];
		expect(profile.totalInches).toBe(232);
	});

	it('computes total linear feet', () => {
		const result = computeMaterials(items);
		const profile = result.byProfile[0];
		expect(profile.totalFeet).toBeCloseTo(232 / 12, 1);
	});

	it('computes weight using steel density', () => {
		const result = computeMaterials(items);
		// Cross section area = (2*2) - ((2-0.15)*(2-0.15)) = 4 - 3.4225 = 0.5775 sq in
		// Volume = 0.5775 * 232 = 133.98 cu in
		// Weight = 133.98 / 1728 * 490 = ~37.99 lbs
		expect(result.totalWeight).toBeGreaterThan(35);
		expect(result.totalWeight).toBeLessThan(42);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/utils/materials.test.ts
```

- [ ] **Step 3: Implement materials.ts**

Create `src/lib/utils/materials.ts`:

```ts
import type { CutListItem } from './cut-list';

const STEEL_DENSITY_LB_PER_CUBIC_INCH = 490 / 1728; // 490 lb/ft³ → lb/in³

export interface ProfileSummary {
	tubeLabel: string;
	width: number;
	height: number;
	thickness: number;
	totalInches: number;
	totalFeet: number;
	weight: number;
	costPerFoot?: number;
	totalCost?: number;
}

export interface MaterialsSummary {
	byProfile: ProfileSummary[];
	totalWeight: number;
	totalCost: number;
}

function crossSectionArea(w: number, h: number, t: number): number {
	const outer = w * h;
	const inner = (w - 2 * t) * (h - 2 * t);
	return outer - inner;
}

export function computeMaterials(
	items: CutListItem[],
	costPerFoot?: Record<string, number>
): MaterialsSummary {
	// Group by tube profile
	const profileMap = new Map<string, { items: CutListItem[]; w: number; h: number; t: number }>();

	for (const item of items) {
		const key = `${item.width}-${item.height}-${item.thickness}`;
		if (!profileMap.has(key)) {
			profileMap.set(key, { items: [], w: item.width, h: item.height, t: item.thickness });
		}
		profileMap.get(key)!.items.push(item);
	}

	const byProfile: ProfileSummary[] = [];
	let totalWeight = 0;
	let totalCost = 0;

	for (const [, { items: profileItems, w, h, t }] of profileMap) {
		const totalInches = profileItems.reduce((sum, i) => sum + i.length * i.quantity, 0);
		const totalFeet = totalInches / 12;
		const area = crossSectionArea(w, h, t);
		const volume = area * totalInches;
		const weight = volume * STEEL_DENSITY_LB_PER_CUBIC_INCH;

		const label = profileItems[0].tubeLabel;
		const cpt = costPerFoot?.[label];
		const cost = cpt ? cpt * totalFeet : 0;

		byProfile.push({
			tubeLabel: label,
			width: w,
			height: h,
			thickness: t,
			totalInches,
			totalFeet,
			weight,
			costPerFoot: cpt,
			totalCost: cost
		});

		totalWeight += weight;
		totalCost += cost;
	}

	return { byProfile, totalWeight, totalCost };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/utils/materials.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/materials.ts src/lib/utils/materials.test.ts
git commit -m "feat: add materials summary computation with tests"
```

---

## Task 11: Output Components — Cut List & Materials Display

**Files:**
- Create: `src/lib/components/output/CutList.svelte`
- Create: `src/lib/components/output/MaterialsSummary.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Create CutList display component**

Create `src/lib/components/output/CutList.svelte`:

```svelte
<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeCutList } from '$lib/utils/cut-list';

	const config = $derived(tableStore.config);
	const items = $derived(computeCutList(config));
	const groups = $derived([...new Set(items.map((i) => i.group))]);

	function formatLength(inches: number, metric: boolean): string {
		if (metric) return `${(inches * 25.4).toFixed(0)} mm`;
		return `${inches.toFixed(2)}"`;
	}
</script>

<div class="space-y-3">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Cut List</h3>

	{#each groups as group}
		<div>
			<h4 class="mb-1 text-xs font-medium text-amber-500">{group}</h4>
			<table class="w-full text-xs">
				<thead>
					<tr class="border-b border-neutral-700 text-neutral-400">
						<th class="pb-1 text-left">Part</th>
						<th class="pb-1 text-left">Tube</th>
						<th class="pb-1 text-right">Length</th>
						<th class="pb-1 text-right">Qty</th>
					</tr>
				</thead>
				<tbody>
					{#each items.filter((i) => i.group === group) as item}
						<tr class="border-b border-neutral-800">
							<td class="py-1">{item.description}</td>
							<td class="py-1 text-neutral-400">{item.tubeLabel}</td>
							<td class="py-1 text-right">{formatLength(item.length, config.metric)}</td>
							<td class="py-1 text-right">{item.quantity}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/each}
</div>
```

- [ ] **Step 2: Create MaterialsSummary display component**

Create `src/lib/components/output/MaterialsSummary.svelte`:

```svelte
<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeCutList } from '$lib/utils/cut-list';
	import { computeMaterials } from '$lib/utils/materials';

	const config = $derived(tableStore.config);
	const items = $derived(computeCutList(config));

	// Cost per foot keyed by tubeLabel — user-editable
	let costPerFoot = $state<Record<string, number>>({});
	const materials = $derived(computeMaterials(items, costPerFoot));
</script>

<div class="space-y-3">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Materials</h3>

	{#each materials.byProfile as profile}
		<div class="rounded bg-neutral-800 p-2 text-xs">
			<div class="font-medium">{profile.tubeLabel}</div>
			<div class="mt-1 flex items-center justify-between text-neutral-400">
				<span>{profile.totalFeet.toFixed(1)} ft</span>
				<span>{profile.weight.toFixed(1)} lbs</span>
				<label class="flex items-center gap-1">
					<span>$/ft</span>
					<input
						type="number"
						step="0.01"
						min="0"
						value={costPerFoot[profile.tubeLabel] ?? ''}
						placeholder="—"
						oninput={(e) => {
							const v = Number(e.currentTarget.value);
							costPerFoot = { ...costPerFoot, [profile.tubeLabel]: v || 0 };
						}}
						class="w-14 rounded bg-neutral-700 px-1 py-0.5 text-right text-white"
					/>
				</label>
			</div>
			{#if profile.totalCost}
				<div class="mt-1 text-right text-amber-400">${profile.totalCost.toFixed(2)}</div>
			{/if}
		</div>
	{/each}

	<div class="border-t border-neutral-700 pt-2 text-sm font-medium">
		<div class="flex justify-between">
			<span>Total Weight</span>
			<span>{materials.totalWeight.toFixed(1)} lbs</span>
		</div>
		{#if materials.totalCost > 0}
			<div class="flex justify-between text-amber-400">
				<span>Total Cost</span>
				<span>${materials.totalCost.toFixed(2)}</span>
			</div>
		{/if}
	</div>
</div>
```

- [ ] **Step 3: Add output components to page**

In `src/routes/+page.svelte`, add imports and render below bracing controls inside the `<aside>`:

```svelte
<div class="mt-6 border-t border-neutral-700 pt-6">
	<CutList />
</div>
<div class="mt-6">
	<MaterialsSummary />
</div>
```

- [ ] **Step 4: Verify — cut list and materials update live as you change parameters**

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/output/ src/routes/+page.svelte
git commit -m "feat: add cut list and materials summary display"
```

---

## Task 12: PDF Export

**Files:**
- Create: `src/lib/utils/export-pdf.ts`
- Create: `src/lib/components/output/ExportButtons.svelte`
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Implement PDF export**

Create `src/lib/utils/export-pdf.ts`:

```ts
import { jsPDF } from 'jspdf';
import type { CutListItem } from './cut-list';
import type { MaterialsSummary } from './materials';
import type { TableConfig } from '$lib/stores/table.svelte';

export function exportPDF(
	config: TableConfig,
	items: CutListItem[],
	materials: MaterialsSummary
): void {
	const doc = new jsPDF();
	const margin = 20;
	let y = margin;

	// Title
	doc.setFontSize(18);
	doc.text('Steel Table — Cut List', margin, y);
	y += 10;

	// Dimensions summary
	doc.setFontSize(10);
	doc.text(
		`Dimensions: ${config.length}" L × ${config.width}" W × ${config.height}" H`,
		margin,
		y
	);
	y += 12;

	// Cut list table
	doc.setFontSize(12);
	doc.text('Cut List', margin, y);
	y += 7;

	doc.setFontSize(8);
	const colX = [margin, margin + 55, margin + 105, margin + 140];
	doc.setFont('helvetica', 'bold');
	doc.text('Part', colX[0], y);
	doc.text('Tube Profile', colX[1], y);
	doc.text('Length', colX[2], y);
	doc.text('Qty', colX[3], y);
	y += 5;
	doc.setFont('helvetica', 'normal');

	for (const item of items) {
		doc.text(item.description, colX[0], y);
		doc.text(item.tubeLabel, colX[1], y);
		doc.text(`${item.length.toFixed(2)}"`, colX[2], y);
		doc.text(String(item.quantity), colX[3], y);
		y += 5;

		if (y > 270) {
			doc.addPage();
			y = margin;
		}
	}

	// Materials summary
	y += 8;
	doc.setFontSize(12);
	doc.text('Materials Summary', margin, y);
	y += 7;

	doc.setFontSize(8);
	for (const profile of materials.byProfile) {
		doc.text(
			`${profile.tubeLabel}: ${profile.totalFeet.toFixed(1)} ft — ${profile.weight.toFixed(1)} lbs`,
			margin,
			y
		);
		y += 5;
	}

	y += 3;
	doc.setFont('helvetica', 'bold');
	doc.text(`Total Weight: ${materials.totalWeight.toFixed(1)} lbs`, margin, y);

	doc.save('tubular-cut-list.pdf');
}
```

- [ ] **Step 2: Create ExportButtons component**

Create `src/lib/components/output/ExportButtons.svelte`:

```svelte
<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeCutList } from '$lib/utils/cut-list';
	import { computeMaterials } from '$lib/utils/materials';
	import { exportPDF } from '$lib/utils/export-pdf';

	const config = $derived(tableStore.config);
	const items = $derived(computeCutList(config));
	const materials = $derived(computeMaterials(items));

	function handlePDF() {
		exportPDF(config, items, materials);
	}
</script>

<div class="flex gap-2">
	<button
		class="flex-1 rounded bg-amber-600 px-3 py-2 text-sm font-medium hover:bg-amber-500"
		onclick={handlePDF}
	>
		Export PDF
	</button>
	<button
		class="flex-1 rounded bg-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-600"
		disabled
	>
		Export DXF
	</button>
</div>
```

- [ ] **Step 3: Add ExportButtons to page**

In `src/routes/+page.svelte`, import `ExportButtons` and add at the bottom of the aside:

```svelte
<div class="mt-6">
	<ExportButtons />
</div>
```

- [ ] **Step 4: Verify — clicking "Export PDF" downloads a PDF with cut list and materials**

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/export-pdf.ts src/lib/components/output/ExportButtons.svelte src/routes/+page.svelte
git commit -m "feat: add PDF export for cut list and materials"
```

---

## Task 13: DXF Export

**Files:**
- Create: `src/lib/utils/export-dxf.ts`
- Modify: `src/lib/components/output/ExportButtons.svelte`

- [ ] **Step 1: Implement DXF export**

Create `src/lib/utils/export-dxf.ts`:

```ts
import type { TableConfig } from '$lib/stores/table.svelte';

// Simple DXF generation — top-down plan view with dimensions
// DXF is a text format; we generate it manually to avoid heavy dependencies.
// If dxf-writer proves useful, swap in later.

export function exportDXF(config: TableConfig): void {
	const lines: string[] = [];

	function addLine(x1: number, y1: number, x2: number, y2: number, layer = '0') {
		lines.push('0', 'LINE', '8', layer, '10', String(x1), '20', String(y1), '30', '0', '11', String(x2), '21', String(y2), '31', '0');
	}

	function addText(x: number, y: number, height: number, text: string, layer = 'DIMS') {
		lines.push('0', 'TEXT', '8', layer, '10', String(x), '20', String(y), '30', '0', '40', String(height), '1', text);
	}

	// Header
	lines.push('0', 'SECTION', '2', 'ENTITIES');

	const l = config.length;
	const w = config.width;
	const lt = config.legTube;

	// Outer rectangle (table footprint)
	addLine(0, 0, l, 0);
	addLine(l, 0, l, w);
	addLine(l, w, 0, w);
	addLine(0, w, 0, 0);

	// Leg rectangles at corners
	const corners = [
		[0, 0],
		[l - lt.width, 0],
		[l - lt.width, w - lt.height],
		[0, w - lt.height]
	];
	for (const [cx, cy] of corners) {
		addLine(cx, cy, cx + lt.width, cy, 'LEGS');
		addLine(cx + lt.width, cy, cx + lt.width, cy + lt.height, 'LEGS');
		addLine(cx + lt.width, cy + lt.height, cx, cy + lt.height, 'LEGS');
		addLine(cx, cy + lt.height, cx, cy, 'LEGS');
	}

	// Dimension text
	addText(l / 2, -3, 2, `${l}"`);
	addText(-5, w / 2, 2, `${w}"`);
	addText(l / 2, w + 3, 1.5, `Height: ${config.height}"`);

	lines.push('0', 'ENDSEC', '0', 'EOF');

	// Download
	const content = lines.join('\n');
	const blob = new Blob([content], { type: 'application/dxf' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'tubular-plan.dxf';
	a.click();
	URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Wire DXF button in ExportButtons**

In `src/lib/components/output/ExportButtons.svelte`, import `exportDXF` and update the DXF button:

```svelte
<button
	class="flex-1 rounded bg-neutral-700 px-3 py-2 text-sm font-medium hover:bg-neutral-600"
	onclick={() => exportDXF(config)}
>
	Export DXF
</button>
```

Remove the `disabled` attribute.

- [ ] **Step 3: Verify — DXF downloads and opens in a CAD viewer or text editor**

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils/export-dxf.ts src/lib/components/output/ExportButtons.svelte
git commit -m "feat: add DXF export with top-down plan view"
```

---

## Task 14: Polish & Final Verification

**Files:**
- Modify: `src/app.css` (global styles if needed)
- Modify: `src/routes/+page.svelte` (any final layout tweaks)

- [ ] **Step 1: Add .gitignore**

Create `.gitignore` with standard SvelteKit entries plus `.superpowers/`:

```
node_modules/
.svelte-kit/
build/
.superpowers/
.DS_Store
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Run dev server and test full flow**

Manual verification checklist:
1. Dimension sliders update 3D model live
2. Tube size changes reflect in 3D model
3. Bracing diagram — clicking sides cycles correctly
4. Shelf frame toggle adds/removes lower frame
5. Brace height slider moves bracing up/down
6. Cut list updates in real time
7. Materials summary shows correct totals
8. PDF export downloads with cut list and materials
9. DXF export downloads valid DXF file
10. Metric toggle converts all displayed values
11. Orbit controls work (rotate, zoom, pan)

- [ ] **Step 4: Build for production**

```bash
npm run build
```

Expected: builds successfully to `build/` directory.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: polish and finalize tubular steel table editor"
git push
```
