<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import type { Side } from '$lib/stores/table.svelte';
	import TubeMember from './TubeMember.svelte';

	interface Props {
		side: Side;
	}

	let { side }: Props = $props();

	const cfg = $derived(tableStore.config);
	const bw = $derived(cfg.braceTube.width);
	const bh = $derived(cfg.braceTube.height);
	const legW = $derived(cfg.legTube.width);
	const legH = $derived(cfg.legTube.height);
	const braceH = $derived(cfg.braceHeight);

	const halfLength = $derived(cfg.length / 2 - legW / 2);
	const halfWidth = $derived(cfg.width / 2 - legH / 2);

	const longSpan = $derived(cfg.length - legW * 2);
	const shortSpan = $derived(cfg.width - legH * 2);

	// Determine span and angle based on side orientation
	const span = $derived(side === 'front' || side === 'back' ? longSpan : shortSpan);
	const diagLength = $derived(Math.sqrt(span * span + braceH * braceH));
	const angle = $derived(Math.atan2(braceH, span));

	// Center position of the X brace
	const center = $derived((): [number, number, number] => {
		switch (side) {
			case 'front':
				return [0, braceH / 2, halfWidth];
			case 'back':
				return [0, braceH / 2, -halfWidth];
			case 'left':
				return [-halfLength, braceH / 2, 0];
			case 'right':
				return [halfLength, braceH / 2, 0];
		}
	});

	// Rotation: diagonals rotate around appropriate axis
	const isFrontBack = $derived(side === 'front' || side === 'back');
	const rot1 = $derived(
		(isFrontBack ? [0, 0, angle] : [angle, 0, 0]) as [number, number, number]
	);
	const rot2 = $derived(
		(isFrontBack ? [0, 0, -angle] : [-angle, 0, 0]) as [number, number, number]
	);

	const diagSize = $derived(
		(isFrontBack ? [diagLength, bh, bw] : [bw, bh, diagLength]) as [number, number, number]
	);
</script>

<TubeMember size={diagSize} position={center()} rotation={rot1} />
<TubeMember size={diagSize} position={center()} rotation={rot2} />
