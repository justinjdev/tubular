<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeBays } from '$lib/utils/drawer-cut-list';
	import TubeMember from './TubeMember.svelte';

	const cfg = $derived(tableStore.config);
	const bays = $derived(computeBays(cfg));

	const legW = $derived(cfg.legTube.width);
	const legH = $derived(cfg.legTube.height);
	const frameH = $derived(cfg.frameTube.height);
	const legHeight = $derived(cfg.height - frameH - cfg.footAllowance);
	const frameBottom = $derived(cfg.footAllowance + legHeight);

	const boxWidth = $derived.by(() => {
		const innerLength = cfg.length - legW * 2;
		const numBays = cfg.centerSupports + 1;
		return innerLength / numBays - cfg.drawerSlideGap * 2;
	});
	const boxDepth = $derived(cfg.drawerDepth);

	const frontLegOuter = $derived(cfg.width / 2);
	const drawerFrontEdge = $derived(frontLegOuter - cfg.drawerFrontInset);
	const zCenter = $derived(drawerFrontEdge - boxDepth / 2);

	const GAP = 0.5;

	// Slide rail cross-section (visual approximation of angle iron)
	const railSize = 1;
	const railThick = 0.125;

	interface DrawerBox {
		position: [number, number, number];
		size: [number, number, number];
	}

	interface SlideRail {
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

	// Horizontal slide rails: run front-to-back (along Z) spanning full gap between legs
	// One pair per drawer (left and right side of bay)
	const railSpan = $derived(cfg.width - legH * 2); // full inner span between front/back legs
	const railZCenter = $derived(0); // centered between legs

	const slideRails = $derived.by<SlideRail[]>(() => {
		const result: SlideRail[] = [];
		const innerLength = cfg.length - legW * 2;
		const numBays = cfg.centerSupports + 1;
		const bayW = innerLength / numBays;

		for (const bay of bays) {
			const bayDrawers = cfg.drawers[bay.bayIndex]?.drawers ?? [];
			if (bayDrawers.length === 0) continue;

			const leftX = bay.bayStartX - bayW / 2 + railThick / 2;
			const rightX = bay.bayStartX + bayW / 2 - railThick / 2;

			let yTop = frameBottom;
			for (const d of bayDrawers) {
				// Rail bottom is 1/4" up from drawer bottom
				const drawerBottom = yTop - d.height;
				const railY = drawerBottom + 0.25 + railSize / 2;

				result.push({
					position: [leftX, railY, railZCenter],
					size: [railThick, railSize, railSpan]
				});
				result.push({
					position: [rightX, railY, railZCenter],
					size: [railThick, railSize, railSpan]
				});

				yTop -= d.height + GAP;
			}
		}
		return result;
	});
</script>

{#each slideRails as rail}
	<TubeMember size={rail.size} position={rail.position} color="#505050" />
{/each}
{#each drawerBoxes as box}
	<TubeMember size={box.size} position={box.position} color="#c49a6c" />
{/each}
