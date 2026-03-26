<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import TubeMember from './TubeMember.svelte';

	const cfg = $derived(tableStore.config);
	const count = $derived(cfg.centerSupports);
	const legHeight = $derived(cfg.height - cfg.frameTube.height - cfg.footAllowance);
	const frameY = $derived(cfg.footAllowance + legHeight + cfg.frameTube.height / 2);

	const fw = $derived(cfg.frameTube.width);
	const fh = $derived(cfg.frameTube.height);
	const legW = $derived(cfg.legTube.width);
	const legH = $derived(cfg.legTube.height);

	// Cross members run along Z (depth), same length as short rails
	const crossLength = $derived(cfg.depth - legW * 2);

	// Evenly space along X between the two short rails
	const halfWidth = $derived(cfg.width / 2 - legW / 2);
	const positions = $derived(() => {
		const result: number[] = [];
		for (let i = 1; i <= count; i++) {
			// Evenly divide the span between -halfWidth and +halfWidth
			const x = -halfWidth + (2 * halfWidth * i) / (count + 1);
			result.push(x);
		}
		return result;
	});
</script>

{#if count > 0}
	{#each positions() as x}
		<TubeMember size={[fw, fh, crossLength]} position={[x, frameY, 0]} color="#a0b0c0" />
	{/each}
{/if}
