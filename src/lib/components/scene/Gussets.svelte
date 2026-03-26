<script lang="ts">
	import { T } from '@threlte/core';
	import { tableStore, resolvedLegDimensions, type GussetFace } from '$lib/stores/table.svelte';
	import { Shape, ExtrudeGeometry } from 'three';

	const cfg = $derived(tableStore.config);
	const legDims = $derived(resolvedLegDimensions(cfg));
	const gs = $derived(cfg.gussetWidth);
	const gh = $derived(cfg.gussetHeight);
	const gt = $derived(cfg.gussetThickness);

	const legW = $derived(legDims.legW);
	const legH = $derived(legDims.legH);
	const legHeight = $derived(cfg.height - cfg.frameTube.height);
	const frameBottom = $derived(cfg.feet.height + legHeight);

	const halfW = $derived(cfg.width / 2 - legW / 2);
	const halfD = $derived(cfg.depth / 2 - legH / 2);

	interface GussetPlacement {
		position: [number, number, number];
		rotation: [number, number, number];
	}

	const gussetKey = $derived(`${gs}-${gh}-${gt}`);

	function makeGussetGeometry(width: number, height: number, thickness: number) {
		const shape = new Shape();
		shape.moveTo(0, 0);
		shape.lineTo(width, 0);
		shape.lineTo(0, -height);
		shape.closePath();
		return new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
	}

	const geometry = $derived(makeGussetGeometry(gs, gh, gt));

	const hasAny = $derived(Object.values(cfg.gussets).some(Boolean));

	// Each corner has 2 gussets:
	//   - X-face gusset: visible from front or back (face = 'front' or 'back')
	//   - Z-face gusset: visible from left or right (face = 'left' or 'right')
	// The face a gusset is on determines which toggle controls it.
	const cornerDefs: { sX: number; sZ: number; xFace: GussetFace; zFace: GussetFace; inX: number; inZ: number }[] = [
		{ sX:  1, sZ:  1, xFace: 'front', zFace: 'right', inX: -1, inZ: -1 }, // front-right
		{ sX: -1, sZ:  1, xFace: 'front', zFace: 'left',  inX:  1, inZ: -1 }, // front-left
		{ sX:  1, sZ: -1, xFace: 'back',  zFace: 'right', inX: -1, inZ:  1 }, // back-right
		{ sX: -1, sZ: -1, xFace: 'back',  zFace: 'left',  inX:  1, inZ:  1 }, // back-left
	];

	const placements = $derived.by<GussetPlacement[]>(() => {
		const y = frameBottom;
		const result: GussetPlacement[] = [];

		for (const c of cornerDefs) {
			const legX = c.sX * halfW;
			const legZ = c.sZ * halfD;

			// X-face gusset (visible from front or back)
			// Plate flush with outer Z edge of leg
			if (cfg.gussets[c.xFace]) {
				const jx = legX + c.inX * legW / 2;
				const rotYx = c.inX === -1 ? Math.PI : 0;
				// Outer Z edge: legZ + sZ * legH/2, plate extends inward by gt
				// After rotation π: extrusion goes -Z, so position at outer edge
				// After rotation 0: extrusion goes +Z, so position at outer edge - gt
				const outerZ = legZ + c.sZ * legH / 2;
				const zPos = c.inX === -1 ? outerZ : outerZ - gt;
				result.push({ position: [jx, y, zPos], rotation: [0, rotYx, 0] });
			}

			// Z-face gusset (visible from left or right)
			// Plate flush with outer X edge of leg
			if (cfg.gussets[c.zFace]) {
				const jz = legZ + c.inZ * legH / 2;
				const rotYz = c.inZ === -1 ? Math.PI / 2 : -Math.PI / 2;
				// Outer X edge: legX + sX * legW/2, plate extends inward by gt
				// After rotation π/2: extrusion goes +X, so position at outer edge - gt
				// After rotation -π/2: extrusion goes -X, so position at outer edge
				const outerX = legX + c.sX * legW / 2;
				const xPos = c.inZ === -1 ? outerX - gt : outerX;
				result.push({ position: [xPos, y, jz], rotation: [0, rotYz, 0] });
			}
		}

		return result;
	});
</script>

{#if hasAny}
	{#key gussetKey}
		{#each placements as g}
			<T.Group position={g.position} rotation={g.rotation}>
				<T.Mesh {geometry}>
					<T.MeshStandardMaterial color="#d4a054" metalness={0.4} roughness={0.6} />
				</T.Mesh>
			</T.Group>
		{/each}
	{/key}
{/if}
