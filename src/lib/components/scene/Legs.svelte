<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import TubeMember from './TubeMember.svelte';

	const cfg = $derived(tableStore.config);
	const legHeight = $derived(cfg.height - cfg.frameTube.height);
	const legW = $derived(cfg.legTube.width);
	const legH = $derived(cfg.legTube.height);

	// Legs are inset by half leg tube width from table edges
	const halfLength = $derived(cfg.length / 2 - legW / 2);
	const halfWidth = $derived(cfg.width / 2 - legH / 2);
	const yCenter = $derived(legHeight / 2);

	const corners = $derived([
		[halfLength, yCenter, halfWidth] as [number, number, number],
		[-halfLength, yCenter, halfWidth] as [number, number, number],
		[halfLength, yCenter, -halfWidth] as [number, number, number],
		[-halfLength, yCenter, -halfWidth] as [number, number, number]
	]);
</script>

{#each corners as pos}
	<TubeMember size={[legW, legHeight, legH]} position={pos} />
{/each}
