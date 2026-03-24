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
	const boxDepth = $derived(cfg.width - legH * 2 - cfg.drawerDepthInset);

	const GAP = 0.5; // gap between stacked drawers

	interface DrawerBox {
		position: [number, number, number];
		size: [number, number, number];
	}

	const drawerBoxes = $derived.by<DrawerBox[]>(() => {
		const result: DrawerBox[] = [];
		for (const bay of bays) {
			const bayDrawers = cfg.drawers[bay.bayIndex]?.drawers ?? [];
			// Stack from top down (just below frame)
			let yTop = frameBottom;
			for (const d of bayDrawers) {
				const yCenter = yTop - d.height / 2;
				result.push({
					position: [bay.bayStartX, yCenter, 0],
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
