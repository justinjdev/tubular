<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import TubeMember from './TubeMember.svelte';

	const cfg = $derived(tableStore.config);
	const legHeight = $derived(cfg.height - cfg.frameTube.height - cfg.footAllowance);
	const legW = $derived(cfg.legTube.width);
	const legH = $derived(cfg.legTube.height);

	// Legs are inset by half leg tube width from table edges
	const halfWidth = $derived(cfg.width / 2 - legW / 2);
	const halfDepth = $derived(cfg.depth / 2 - legH / 2);
	const yCenter = $derived(cfg.footAllowance + legHeight / 2);

	const corners = $derived([
		[halfWidth, yCenter, halfDepth] as [number, number, number],
		[-halfWidth, yCenter, halfDepth] as [number, number, number],
		[halfWidth, yCenter, -halfDepth] as [number, number, number],
		[-halfWidth, yCenter, -halfDepth] as [number, number, number]
	]);
</script>

{#each corners as pos}
	<TubeMember size={[legW, legHeight, legH]} position={pos} color="#7a8a9a" />
{/each}
