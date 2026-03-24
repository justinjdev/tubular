<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { inToDisplay, lengthUnit } from '$lib/utils/units';
	import { toFraction } from '$lib/utils/fractions';

	const config = $derived(tableStore.config);
</script>

<section class="flex flex-col gap-4">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Structure</h3>

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

	<!-- Corner gussets toggle -->
	<label class="flex cursor-pointer items-center gap-2">
		<input
			type="checkbox"
			class="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-amber-500"
			checked={config.gussets}
			onchange={() => tableStore.toggleGussets()}
		/>
		<span class="text-sm text-neutral-300">Corner gussets</span>
	</label>

	{#if config.gussets}
		<!-- Gusset size -->
		<div class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between">
				<label for="gusset-size" class="text-xs text-neutral-500">Gusset Size</label>
				<div class="flex items-center gap-1">
					<span class="text-xs text-neutral-400">
						{inToDisplay(config.gussetSize, config.metric)} {lengthUnit(config.metric)}
					</span>
					{#if !config.metric}
						<span class="text-[10px] text-neutral-500">({toFraction(config.gussetSize)}")</span>
					{/if}
				</div>
			</div>
			<input
				id="gusset-size"
				type="range"
				class="accent-amber-500"
				min={1}
				max={8}
				step={0.5}
				value={config.gussetSize}
				oninput={(e) => tableStore.updateGussetSize(parseFloat((e.target as HTMLInputElement).value))}
			/>
		</div>

		<!-- Gusset thickness -->
		<div class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between">
				<label for="gusset-thickness" class="text-xs text-neutral-500">Gusset Thickness</label>
				<span class="text-xs text-neutral-400">
					{#if config.metric}
						{(config.gussetThickness * 25.4).toFixed(1)} mm
					{:else}
						{toFraction(config.gussetThickness)}"
					{/if}
				</span>
			</div>
			<select
				id="gusset-thickness"
				class="rounded bg-neutral-800 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
				value={config.gussetThickness}
				onchange={(e) => tableStore.updateGussetThickness(parseFloat((e.target as HTMLSelectElement).value))}
			>
				<option value={0.125}>1/8" (3.2 mm)</option>
				<option value={0.1875}>3/16" (4.8 mm)</option>
				<option value={0.25}>1/4" (6.4 mm)</option>
				<option value={0.375}>3/8" (9.5 mm)</option>
			</select>
		</div>
	{/if}

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
