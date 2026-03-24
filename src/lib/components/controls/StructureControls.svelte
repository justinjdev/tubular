<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { inToDisplay, lengthUnit } from '$lib/utils/units';
	import { toFraction } from '$lib/utils/fractions';

	const config = $derived(tableStore.config);
</script>

<section class="flex flex-col gap-4">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Lower Structure</h3>

	<!-- Shelf frame toggle -->
	<label class="flex cursor-pointer items-center gap-2">
		<input
			type="checkbox"
			class="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-amber-500"
			checked={config.shelfFrame}
			onchange={() => tableStore.toggleShelfFrame()}
		/>
		<span class="text-sm text-neutral-300">Shelf frame</span>
	</label>

	<!-- Center supports -->
	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between">
			<label for="center-supports" class="text-xs text-neutral-500">Center Supports</label>
			<span class="text-xs text-neutral-400">{config.centerSupports}</span>
		</div>
		<input
			id="center-supports"
			type="number"
			class="w-full rounded bg-neutral-800 px-2 py-1 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
			value={config.centerSupports}
			min={0}
			max={5}
			step={1}
			oninput={(e) => {
				const v = parseInt((e.target as HTMLInputElement).value, 10);
				if (!isNaN(v)) tableStore.updateCenterSupports(v);
			}}
		/>
	</div>

	<!-- Foot/leveler allowance -->
	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between">
			<label for="foot-allowance" class="text-xs text-neutral-500">Foot Allowance</label>
			<div class="flex items-center gap-1">
				<span class="text-xs text-neutral-400">
					{inToDisplay(config.footAllowance, config.metric)} {lengthUnit(config.metric)}
				</span>
				{#if !config.metric}
					<span class="text-[10px] text-neutral-500">({toFraction(config.footAllowance)}")</span>
				{/if}
			</div>
		</div>
		<input
			id="foot-allowance"
			type="range"
			class="accent-amber-500"
			min={0}
			max={4}
			step={0.25}
			value={config.footAllowance}
			oninput={(e) => tableStore.updateFootAllowance(parseFloat((e.target as HTMLInputElement).value))}
		/>
	</div>
</section>
