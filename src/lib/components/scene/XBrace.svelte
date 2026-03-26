<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import type { Side } from '$lib/stores/table.svelte';
	import TubeMember from './TubeMember.svelte';

	interface Props {
		side: Side;
	}

	let { side }: Props = $props();

	const cfg = $derived(tableStore.config);
	const isFlat = $derived(cfg.braceTube.stockType === 'flat-bar');
	// Flat bar: wide face vertical (width → Y), thin face → depth
	const bVertical = $derived(isFlat ? cfg.braceTube.width : cfg.braceTube.height);
	const bDepth = $derived(isFlat ? cfg.braceTube.height : cfg.braceTube.width);
	const legW = $derived(cfg.legTube.width);
	const legH = $derived(cfg.legTube.height);
	const braceBot = $derived(cfg.braceBottom);
	const braceSpan = $derived(cfg.braceSpan);

	const halfWidth = $derived(cfg.width / 2 - legW / 2);
	const halfDepth = $derived(cfg.depth / 2 - legH / 2);

	const longSpan = $derived(cfg.width - legW * 2);
	const shortSpan = $derived(cfg.depth - legH * 2);

	// Determine span and angle based on side orientation
	const span = $derived(side === 'front' || side === 'back' ? longSpan : shortSpan);
	const diagLength = $derived(Math.sqrt(span * span + braceSpan * braceSpan));
	const angle = $derived(Math.atan2(braceSpan, span));

	// Center position of the X brace (vertically centered between bottom and top)
	const centerY = $derived(braceBot + braceSpan / 2);

	const isFrontBack = $derived(side === 'front' || side === 'back');

	// Offset each diagonal slightly in the depth axis to prevent z-fighting
	const halfBraceDepth = $derived(bDepth / 2);

	const center1 = $derived((): [number, number, number] => {
		switch (side) {
			case 'front':
				return [0, centerY, halfDepth + halfBraceDepth];
			case 'back':
				return [0, centerY, -halfDepth - halfBraceDepth];
			case 'left':
				return [-halfWidth - halfBraceDepth, centerY, 0];
			case 'right':
				return [halfWidth + halfBraceDepth, centerY, 0];
		}
	});

	const center2 = $derived((): [number, number, number] => {
		switch (side) {
			case 'front':
				return [0, centerY, halfDepth - halfBraceDepth];
			case 'back':
				return [0, centerY, -halfDepth + halfBraceDepth];
			case 'left':
				return [-halfWidth + halfBraceDepth, centerY, 0];
			case 'right':
				return [halfWidth - halfBraceDepth, centerY, 0];
		}
	});

	// Rotation: diagonals rotate around appropriate axis
	const rot1 = $derived(
		(isFrontBack ? [0, 0, angle] : [angle, 0, 0]) as [number, number, number]
	);
	const rot2 = $derived(
		(isFrontBack ? [0, 0, -angle] : [-angle, 0, 0]) as [number, number, number]
	);

	const diagSize = $derived(
		(isFrontBack ? [diagLength, bVertical, bDepth] : [bDepth, bVertical, diagLength]) as [number, number, number]
	);
</script>

<TubeMember size={diagSize} position={center1()} rotation={rot1} color="#c08040" />
<TubeMember size={diagSize} position={center2()} rotation={rot2} color="#c08040" />
