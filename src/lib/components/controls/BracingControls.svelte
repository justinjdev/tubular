<script lang="ts">
	import { tableStore, type BraceType, type Side } from '$lib/stores/table.svelte';
	import { inToDisplay, lengthUnit } from '$lib/utils/units';
	import { toFraction } from '$lib/utils/fractions';

	const config = $derived(tableStore.config);

	const CYCLE: BraceType[] = ['none', 'h-brace', 'x-brace'];

	const SIDE_LABELS: Record<BraceType, string> = {
		none: '—',
		'h-brace': 'H',
		'x-brace': 'X'
	};

	function cycleBrace(side: Side) {
		const current = config.bracing[side];
		const idx = CYCLE.indexOf(current);
		const next = CYCLE[(idx + 1) % CYCLE.length];
		tableStore.updateBracing(side, next);
	}

	function braceColor(type: BraceType): string {
		switch (type) {
			case 'h-brace':
				return 'bg-amber-700 text-amber-200 ring-amber-600';
			case 'x-brace':
				return 'bg-blue-700 text-blue-200 ring-blue-600';
			default:
				return 'bg-neutral-700 text-neutral-400 ring-neutral-600';
		}
	}
</script>

<div class="flex flex-col gap-3">

	<!-- Top-down diagram -->
	<div class="flex flex-col items-center gap-1">
		<span class="mb-1 text-[10px] uppercase text-neutral-600">Top View</span>

		<!-- Back -->
		<button
			class="h-7 w-32 rounded-t ring-1 text-xs font-bold transition-colors {braceColor(config.bracing.back)}"
			onclick={() => cycleBrace('back')}
			title="Back — click to cycle"
		>
			{SIDE_LABELS[config.bracing.back]} Back
		</button>

		<div class="flex items-center gap-1">
			<!-- Left -->
			<button
				class="h-20 w-7 rounded-l ring-1 text-xs font-bold transition-colors [writing-mode:vertical-lr] {braceColor(config.bracing.left)}"
				onclick={() => cycleBrace('left')}
				title="Left — click to cycle"
			>
				{SIDE_LABELS[config.bracing.left]} L
			</button>

			<!-- Table interior -->
			<div class="flex h-20 w-[104px] items-center justify-center rounded border border-dashed border-neutral-700">
				<span class="text-[10px] text-neutral-600">table</span>
			</div>

			<!-- Right -->
			<button
				class="h-20 w-7 rounded-r ring-1 text-xs font-bold transition-colors [writing-mode:vertical-lr] {braceColor(config.bracing.right)}"
				onclick={() => cycleBrace('right')}
				title="Right — click to cycle"
			>
				{SIDE_LABELS[config.bracing.right]} R
			</button>
		</div>

		<!-- Front -->
		<button
			class="h-7 w-32 rounded-b ring-1 text-xs font-bold transition-colors {braceColor(config.bracing.front)}"
			onclick={() => cycleBrace('front')}
			title="Front — click to cycle"
		>
			{SIDE_LABELS[config.bracing.front]} Front
		</button>
	</div>

	<!-- Legend -->
	<div class="flex justify-center gap-3 text-[10px] text-neutral-500">
		<span class="flex items-center gap-1">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-neutral-700"></span> None
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-amber-700"></span> H-Brace
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-2.5 w-2.5 rounded-sm bg-blue-700"></span> X-Brace
		</span>
	</div>

	<!-- Brace offset from floor -->
	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between">
			<label for="brace-bottom" class="text-xs text-neutral-500">Offset from floor</label>
			<span class="text-xs text-neutral-400">
				{inToDisplay(config.braceBottom, config.metric)} {lengthUnit(config.metric)}
				{#if !config.metric}
					<span class="text-neutral-500">({toFraction(config.braceBottom)}")</span>
				{/if}
			</span>
		</div>
		<input
			id="brace-bottom"
			type="range"
			class="accent-amber-500"
			min={0}
			max={config.height - config.braceSpan - 1}
			step={0.5}
			value={config.braceBottom}
			oninput={(e) => tableStore.updateBraceBottom(parseFloat((e.target as HTMLInputElement).value))}
		/>
	</div>

	<!-- Brace span (vertical extent) -->
	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between">
			<label for="brace-span" class="text-xs text-neutral-500">Brace span</label>
			<span class="text-xs text-neutral-400">
				{inToDisplay(config.braceSpan, config.metric)} {lengthUnit(config.metric)}
				{#if !config.metric}
					<span class="text-neutral-500">({toFraction(config.braceSpan)}")</span>
				{/if}
			</span>
		</div>
		<input
			id="brace-span"
			type="range"
			class="accent-amber-500"
			min={1}
			max={config.height - config.braceBottom - 1}
			step={0.5}
			value={config.braceSpan}
			oninput={(e) => tableStore.updateBraceSpan(parseFloat((e.target as HTMLInputElement).value))}
		/>
	</div>
</div>
