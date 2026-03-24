<script lang="ts">
	import { T } from '@threlte/core';
	import { tableStore, type GussetFace } from '$lib/stores/table.svelte';
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

	function makeGussetGeometry(size: number, thickness: number) {
		const shape = new Shape();
		shape.moveTo(0, 0);
		shape.lineTo(size, 0);
		shape.lineTo(0, -size);
		shape.closePath();
		return new ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
	}

	const geometry = $derived(makeGussetGeometry(gs, gt));

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
			const legX = c.sX * halfL;
			const legZ = c.sZ * halfW;

			// X-face gusset (visible from front or back)
			if (cfg.gussets[c.xFace]) {
				const jx = legX + c.inX * legW / 2;
				const rotYx = c.inX === -1 ? Math.PI : 0;
				const zPos = c.inX === -1 ? legZ + gt / 2 : legZ - gt / 2;
				result.push({ position: [jx, y, zPos], rotation: [0, rotYx, 0] });
			}

			// Z-face gusset (visible from left or right)
			if (cfg.gussets[c.zFace]) {
				const jz = legZ + c.inZ * legH / 2;
				const rotYz = c.inZ === -1 ? Math.PI / 2 : -Math.PI / 2;
				const xPos = c.inZ === -1 ? legX - gt / 2 : legX + gt / 2;
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
