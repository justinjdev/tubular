<script lang="ts">
	import { tableStore, type TabletopMaterial } from '$lib/stores/table.svelte';
	import { inToDisplay, lengthUnit } from '$lib/utils/units';
	import { toFraction } from '$lib/utils/fractions';

	const materialOptions: { value: TabletopMaterial; label: string }[] = [
		{ value: 'none', label: 'None' },
		{ value: 'steel-plate', label: 'Steel Plate' },
		{ value: 'diamond-plate', label: 'Diamond Plate' },
		{ value: 'expanded-metal', label: 'Expanded Metal' },
		{ value: 'wood-butcher-block', label: 'Wood Butcher Block' },
		{ value: 'plywood', label: 'Plywood' },
		{ value: 'mdf', label: 'MDF' },
	];

	const config = $derived(tableStore.config);
	const top = $derived(config.tabletop);
	const isMetal = $derived(
		top.material === 'steel-plate' || top.material === 'diamond-plate' || top.material === 'expanded-metal'
	);
	const isWood = $derived(
		top.material === 'wood-butcher-block' || top.material === 'plywood' || top.material === 'mdf'
	);
	const thicknessStep = $derived(isMetal ? 0.0625 : 0.25);

	const allOverhangsSame = $derived(
		top.overhangFront === top.overhangBack &&
		top.overhangBack === top.overhangLeft &&
		top.overhangLeft === top.overhangRight
	);

	const topWidth = $derived(config.width + top.overhangLeft + top.overhangRight);
	const topDepth = $derived(config.depth + top.overhangFront + top.overhangBack);

	const materialInfo = $derived.by(() => {
		if (top.material === 'steel-plate') {
			const lbPerSqFt = 40.8 * top.thickness;
			return `Weight: ~${lbPerSqFt.toFixed(1)} lb/sq ft at ${toFraction(top.thickness)}" thick`;
		}
		if (top.material === 'diamond-plate') {
			const lbPerSqFt = 40.8 * top.thickness;
			return `Weight: ~${lbPerSqFt.toFixed(1)} lb/sq ft at ${toFraction(top.thickness)}" thick`;
		}
		if (top.material === 'expanded-metal') {
			return 'Standard flattened expanded \u2014 specify gauge separately';
		}
		if (top.material === 'wood-butcher-block') {
			return 'Standard butcher block from hardwood suppliers';
		}
		if (top.material === 'plywood') {
			return 'Cabinet-grade plywood';
		}
		if (top.material === 'mdf') {
			return 'Medium-density fiberboard \u2014 paint or laminate recommended';
		}
		return null;
	});
</script>

<div class="flex flex-col gap-3">
	<!-- Material picker -->
	<div class="flex flex-col gap-1.5">
		<label for="tabletop-material" class="text-xs text-neutral-500">Material</label>
		<select
			id="tabletop-material"
			class="rounded bg-neutral-800 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
			value={top.material}
			onchange={(e) => tableStore.updateTabletopMaterial((e.target as HTMLSelectElement).value as TabletopMaterial)}
		>
			{#each materialOptions as opt}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>

	{#if top.material !== 'none'}
		<!-- Material info -->
		{#if materialInfo}
			<span class="text-[10px] text-neutral-500">{materialInfo}</span>
		{/if}

		<!-- Thickness -->
		<div class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between">
				<label for="tabletop-thickness" class="text-xs text-neutral-500">Thickness</label>
				<div class="flex items-center gap-1">
					<span class="text-xs text-neutral-400">
						{inToDisplay(top.thickness, config.metric)} {lengthUnit(config.metric)}
					</span>
					{#if !config.metric}
						<span class="text-[10px] text-neutral-500">({toFraction(top.thickness)}")</span>
					{/if}
				</div>
			</div>
			<input
				id="tabletop-thickness"
				type="range"
				class="accent-amber-500"
				min={0.0625}
				max={isMetal ? 1 : 4}
				step={thicknessStep}
				value={top.thickness}
				oninput={(e) => tableStore.updateTabletopThickness(parseFloat((e.target as HTMLInputElement).value))}
			/>
		</div>

		<!-- Overhang: set all -->
		<div class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between">
				<label for="tabletop-overhang-all" class="text-xs text-neutral-500">Overhang (all sides)</label>
				<div class="flex items-center gap-1">
					<span class="text-xs text-neutral-400">
						{allOverhangsSame
							? `${inToDisplay(top.overhangFront, config.metric)} ${lengthUnit(config.metric)}`
							: 'varies'}
					</span>
					{#if !config.metric && allOverhangsSame}
						<span class="text-[10px] text-neutral-500">({toFraction(top.overhangFront)}")</span>
					{/if}
				</div>
			</div>
			<input
				id="tabletop-overhang-all"
				type="range"
				class="accent-amber-500"
				min={0}
				max={6}
				step={0.25}
				value={allOverhangsSame ? top.overhangFront : 0}
				oninput={(e) => tableStore.updateTabletopOverhangAll(parseFloat((e.target as HTMLInputElement).value))}
			/>
		</div>

		<!-- Per-side overhangs -->
		<div class="flex flex-col gap-1.5">
			<span class="text-[10px] uppercase text-neutral-600">Per-Side Overhang</span>
			{#each [
				{ side: 'front' as const, label: 'Front', value: top.overhangFront },
				{ side: 'back' as const, label: 'Back', value: top.overhangBack },
				{ side: 'left' as const, label: 'Left', value: top.overhangLeft },
				{ side: 'right' as const, label: 'Right', value: top.overhangRight },
			] as item}
				<div class="flex items-center gap-2">
					<span class="w-10 text-[11px] text-neutral-500">{item.label}</span>
					<input
						type="range"
						class="flex-1 accent-amber-500"
						min={0}
						max={6}
						step={0.25}
						value={item.value}
						oninput={(e) => tableStore.updateTabletopOverhang(item.side, parseFloat((e.target as HTMLInputElement).value))}
					/>
					<span class="w-12 text-right text-[11px] text-neutral-400">
						{#if config.metric}
							{inToDisplay(item.value, true)} mm
						{:else}
							{toFraction(item.value)}"
						{/if}
					</span>
				</div>
			{/each}
		</div>

		<!-- Total top dimensions -->
		<div class="flex items-center justify-between rounded bg-neutral-800/50 px-2 py-1.5">
			<span class="text-[10px] text-neutral-500">Top size</span>
			<span class="text-xs text-neutral-400">
				{inToDisplay(topWidth, config.metric)} x {inToDisplay(topDepth, config.metric)} {lengthUnit(config.metric)}
			</span>
		</div>
	{/if}
</div>
