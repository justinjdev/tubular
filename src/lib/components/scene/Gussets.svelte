<script lang="ts">
	import { T } from '@threlte/core';
	import { tableStore } from '$lib/stores/table.svelte';
	import { Shape, ExtrudeGeometry } from 'three';

	const cfg = $derived(tableStore.config);
	const gs = $derived(cfg.gussetSize);
	const gt = $derived(cfg.gussetThickness);

	const legW = $derived(cfg.legTube.width);
	const legH = $derived(cfg.legTube.height);
	const legHeight = $derived(cfg.height - cfg.frameTube.height - cfg.footAllowance);
	const frameBottom = $derived(cfg.footAllowance + legHeight);

	const halfL = $derived(cfg.length / 2 - legW / 2);
	const halfW = $derived(cfg.width / 2 - legH / 2);

	interface GussetPlacement {
		position: [number, number, number];
		rotation: [number, number, number];
	}

	const gussetKey = $derived(`${gs}-${gt}`);

	// Right-triangle shape in XY plane:
	//   (0,0) corner → (size, 0) horizontal → (0, -size) vertical (down)
	// Extruded along +Z by thickness
	function makeGussetGeometry(size: number, thickness: number) {
		const shape = new Shape();
		shape.moveTo(0, 0);
		shape.lineTo(size, 0);
		shape.lineTo(0, -size);
		shape.closePath();
		return new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
	}

	const geometry = $derived(makeGussetGeometry(gs, gt));

	// 4 corners, each with inward direction signs toward table center
	// For each corner, 2 gussets: one on the X-face, one on the Z-face
	const placements = $derived.by<GussetPlacement[]>(() => {
		const y = frameBottom;
		const result: GussetPlacement[] = [];

		const corners = [
			{ legX:  halfL, legZ:  halfW, inX: -1, inZ: -1 }, // front-right
			{ legX: -halfL, legZ:  halfW, inX:  1, inZ: -1 }, // front-left
			{ legX:  halfL, legZ: -halfW, inX: -1, inZ:  1 }, // back-right
			{ legX: -halfL, legZ: -halfW, inX:  1, inZ:  1 }, // back-left
		];

		for (const c of corners) {
			// Gusset on X-face (visible from front/back)
			// Sits on the inner X edge of the leg, horizontal extends inX
			const jx = c.legX + c.inX * legW / 2;
			const rotYx = c.inX === -1 ? Math.PI : 0;
			// Center plate thickness on leg's Z position
			const zPos = c.inX === -1 ? c.legZ + gt / 2 : c.legZ - gt / 2;
			result.push({ position: [jx, y, zPos], rotation: [0, rotYx, 0] });

			// Gusset on Z-face (visible from left/right)
			// Sits on the inner Z edge of the leg, horizontal extends inZ
			const jz = c.legZ + c.inZ * legH / 2;
			const rotYz = c.inZ === -1 ? Math.PI / 2 : -Math.PI / 2;
			// Center plate thickness on leg's X position
			const xPos = c.inZ === -1 ? c.legX - gt / 2 : c.legX + gt / 2;
			result.push({ position: [xPos, y, jz], rotation: [0, rotYz, 0] });
		}

		return result;
	});
</script>

{#if cfg.gussets}
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
