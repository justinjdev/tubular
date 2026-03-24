<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeBays } from '$lib/utils/drawer-cut-list';
	import TubeMember from './TubeMember.svelte';

	const cfg = $derived(tableStore.config);
	const bays = $derived(computeBays(cfg));

	const legH = $derived(cfg.legTube.height);
	const frameH = $derived(cfg.frameTube.height);
	const legHeight = $derived(cfg.height - frameH - cfg.footAllowance);
	const frameBottom = $derived(cfg.footAllowance + legHeight);

	const boxWidth = $derived.by(() => {
		const legW = cfg.legTube.width;
		const innerLength = cfg.length - legW * 2;
		const numBays = cfg.centerSupports + 1;
		return innerLength / numBays - cfg.drawerSlideGap * 2;
	});
	const boxDepth = $derived(cfg.drawerDepth);

	// Front is +Z. Front leg outer face = width/2.
	// With 0 inset, drawer front face is flush with outer edge of front legs.
	const frontLegOuter = $derived(cfg.width / 2);
	const drawerFrontEdge = $derived(frontLegOuter - cfg.drawerFrontInset);
	const zCenter = $derived(drawerFrontEdge - boxDepth / 2);

	const GAP = 0.5;

	interface DrawerBox {
		position: [number, number, number];
		size: [number, number, number];
	}

	const drawerBoxes = $derived.by<DrawerBox[]>(() => {
		const result: DrawerBox[] = [];
		for (const bay of bays) {
			const bayDrawers = cfg.drawers[bay.bayIndex]?.drawers ?? [];
			let yTop = frameBottom;
			for (const d of bayDrawers) {
				const yCenter = yTop - d.height / 2;
				result.push({
					position: [bay.bayStartX, yCenter, zCenter],
					size: [boxWidth, d.height, boxDepth]
				});
				yTop -= d.height + GAP;
			}
		}
		return result;
	});
</script>

{#each drawerBoxes as box}
	<TubeMember size={box.size} position={box.position} color="#c49a6c" />
{/each}
