<script lang="ts">
	import { tableStore, resolvedLegDimensions } from '$lib/stores/table.svelte';
	import TubeMember from './TubeMember.svelte';

	const cfg = $derived(tableStore.config);
	const legDims = $derived(resolvedLegDimensions(cfg));
	const legHeight = $derived(cfg.height - cfg.frameTube.height);
	const legW = $derived(legDims.legW);
	const legH = $derived(legDims.legH);

	// Legs are inset by half leg tube width from table edges
	const halfWidth = $derived(cfg.width / 2 - legW / 2);
	const halfDepth = $derived(cfg.depth / 2 - legH / 2);
	const yCenter = $derived(cfg.feet.height + legHeight / 2);

	const corners = $derived([
		[halfWidth, yCenter, halfDepth] as [number, number, number],
		[-halfWidth, yCenter, halfDepth] as [number, number, number],
		[halfWidth, yCenter, -halfDepth] as [number, number, number],
		[-halfWidth, yCenter, -halfDepth] as [number, number, number]
	]);
</script>

{#each corners as pos}
	<TubeMember size={[legW, legHeight, legH]} position={pos} color="#7a8a9a" stockType={cfg.legTube.stockType} />
{/each}
