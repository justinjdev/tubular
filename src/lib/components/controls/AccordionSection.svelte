<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		summary?: string;
		open?: boolean;
		onToggle?: () => void;
		children: Snippet;
	}

	let { title, summary = '', open = false, onToggle, children }: Props = $props();
</script>

<div class="border-b border-neutral-800/60">
	<button
		class="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-neutral-800/30"
		onclick={onToggle}
	>
		<svg
			class="h-3 w-3 shrink-0 text-neutral-600 transition-transform {open ? 'rotate-90' : ''}"
			fill="currentColor" viewBox="0 0 8 12"
		>
			<path d="M1.5 0L7.5 6L1.5 12z" />
		</svg>
		<span class="text-xs font-semibold uppercase tracking-widest text-neutral-400">{title}</span>
		{#if !open && summary}
			<span class="ml-auto truncate text-[11px] text-neutral-600">{summary}</span>
		{/if}
	</button>
	{#if open}
		<div class="flex flex-col gap-3 px-5 pb-4">
			{@render children()}
		</div>
	{/if}
</div>
