<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import type { Side } from '$lib/stores/table.svelte';
	import HBrace from './HBrace.svelte';
	import XBrace from './XBrace.svelte';
	import ShelfFrame from './ShelfFrame.svelte';

	const cfg = $derived(tableStore.config);

	const sides: Side[] = ['front', 'back', 'left', 'right'];
</script>

{#each sides as side}
	{#if cfg.bracing[side] === 'h-brace'}
		<HBrace {side} />
	{:else if cfg.bracing[side] === 'x-brace'}
		<XBrace {side} />
	{/if}
{/each}

{#if cfg.shelfFrame}
	<ShelfFrame />
{/if}
