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
	const braceY = $derived(cfg.braceBottom + cfg.braceSpan);

	// Compute position and span based on which side
	const halfLength = $derived(cfg.length / 2 - legW / 2);
	const halfWidth = $derived(cfg.width / 2 - legH / 2);

	// Span between legs minus tube width for fitment
	const longSpan = $derived(cfg.length - legW * 2);
	const shortSpan = $derived(cfg.width - legH * 2);

	const position = $derived((): [number, number, number] => {
		switch (side) {
			case 'front':
				return [0, braceY, halfWidth];
			case 'back':
				return [0, braceY, -halfWidth];
			case 'left':
				return [-halfLength, braceY, 0];
			case 'right':
				return [halfLength, braceY, 0];
		}
	});

	const size = $derived((): [number, number, number] => {
		if (side === 'front' || side === 'back') {
			return [longSpan, bVertical, bDepth];
		}
		return [bDepth, bVertical, shortSpan];
	});
</script>

<TubeMember size={size()} position={position()} />
