<script lang="ts">
	import { tableStore, type GussetFace, type FeetType } from '$lib/stores/table.svelte';
	import { inToDisplay, lengthUnit } from '$lib/utils/units';
	import { toFraction } from '$lib/utils/fractions';

	const feetTypes: { value: FeetType; label: string }[] = [
		{ value: 'none', label: 'None' },
		{ value: 'leveling', label: 'Leveling' },
		{ value: 'caster', label: 'Caster' },
	];

	const threadSizes = ['3/8-16', '1/2-13', '5/8-11', 'M10×1.5', 'M12×1.75'];

	const config = $derived(tableStore.config);
	const totalHeight = $derived(config.height + config.feet.height);

	const anyGusset = $derived(Object.values(config.gussets).some(Boolean));
	const allGussets = $derived(Object.values(config.gussets).every(Boolean));

	function gussetColor(face: GussetFace): string {
		return config.gussets[face]
			? 'bg-amber-700 text-amber-200 ring-amber-600'
			: 'bg-neutral-700 text-neutral-400 ring-neutral-600';
	}
</script>

<div class="flex flex-col gap-3">

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

	<!-- Corner gussets -->
	<div class="flex flex-col gap-2">
		<label class="flex cursor-pointer items-center gap-2">
			<input
				type="checkbox"
				class="h-4 w-4 rounded border-neutral-600 bg-neutral-800 accent-amber-500"
				checked={allGussets}
				indeterminate={anyGusset && !allGussets}
				onchange={() => tableStore.setAllGussets(!allGussets)}
			/>
			<span class="text-sm text-neutral-300">Corner gussets</span>
		</label>

		{#if anyGusset}
			<!-- Per-side diagram — same layout as bracing controls -->
			<div class="flex flex-col items-center gap-1">
				<span class="mb-1 text-[10px] uppercase text-neutral-600">Gusset Sides</span>

				<!-- Back -->
				<button
					class="h-7 w-32 rounded-t ring-1 text-xs font-bold transition-colors {gussetColor('back')}"
					onclick={() => tableStore.toggleGussetFace('back')}
					title="Back — click to toggle"
				>
					{config.gussets.back ? 'Back' : '—'}
				</button>

				<div class="flex items-center gap-1">
					<!-- Left -->
					<button
						class="h-20 w-7 rounded-l ring-1 text-xs font-bold transition-colors [writing-mode:vertical-lr] {gussetColor('left')}"
						onclick={() => tableStore.toggleGussetFace('left')}
						title="Left — click to toggle"
					>
						{config.gussets.left ? 'L' : '—'}
					</button>

					<!-- Table interior -->
					<div class="flex h-20 w-[104px] items-center justify-center rounded border border-dashed border-neutral-700">
						<span class="text-[10px] text-neutral-600">table</span>
					</div>

					<!-- Right -->
					<button
						class="h-20 w-7 rounded-r ring-1 text-xs font-bold transition-colors [writing-mode:vertical-lr] {gussetColor('right')}"
						onclick={() => tableStore.toggleGussetFace('right')}
						title="Right — click to toggle"
					>
						{config.gussets.right ? 'R' : '—'}
					</button>
				</div>

				<!-- Front -->
				<button
					class="h-7 w-32 rounded-b ring-1 text-xs font-bold transition-colors {gussetColor('front')}"
					onclick={() => tableStore.toggleGussetFace('front')}
					title="Front — click to toggle"
				>
					{config.gussets.front ? 'Front' : '—'}
				</button>
			</div>
		{/if}
	</div>

	{#if anyGusset}
		<!-- Gusset width -->
		<div class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between">
				<label for="gusset-width" class="text-xs text-neutral-500">Gusset width</label>
				<div class="flex items-center gap-1">
					<span class="text-xs text-neutral-400">
						{inToDisplay(config.gussetWidth, config.metric)} {lengthUnit(config.metric)}
					</span>
					{#if !config.metric}
						<span class="text-[10px] text-neutral-500">({toFraction(config.gussetWidth)}")</span>
					{/if}
				</div>
			</div>
			<input
				id="gusset-width"
				type="range"
				class="accent-amber-500"
				min={1}
				max={8}
				step={0.5}
				value={config.gussetWidth}
				oninput={(e) => tableStore.updateGussetWidth(parseFloat((e.target as HTMLInputElement).value))}
			/>
		</div>

		<!-- Gusset height -->
		<div class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between">
				<label for="gusset-height" class="text-xs text-neutral-500">Gusset height</label>
				<div class="flex items-center gap-1">
					<span class="text-xs text-neutral-400">
						{inToDisplay(config.gussetHeight, config.metric)} {lengthUnit(config.metric)}
					</span>
					{#if !config.metric}
						<span class="text-[10px] text-neutral-500">({toFraction(config.gussetHeight)}")</span>
					{/if}
				</div>
			</div>
			<input
				id="gusset-height"
				type="range"
				class="accent-amber-500"
				min={1}
				max={8}
				step={0.5}
				value={config.gussetHeight}
				oninput={(e) => tableStore.updateGussetHeight(parseFloat((e.target as HTMLInputElement).value))}
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

	<!-- Leveling feet / casters -->
	<div class="flex flex-col gap-2">
		<span class="text-xs text-neutral-500">Feet / Casters</span>
		<div class="flex gap-0.5 rounded-lg bg-neutral-800 p-0.5">
			{#each feetTypes as ft}
				<button
					class="flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors {config.feet.type === ft.value ? 'bg-amber-700 text-amber-200' : 'text-neutral-400 hover:text-neutral-300'}"
					onclick={() => tableStore.updateFeetType(ft.value)}
				>
					{ft.label}
				</button>
			{/each}
		</div>

		{#if config.feet.type !== 'none'}
			<!-- Thread size -->
			<div class="flex items-center justify-between">
				<label for="thread-size" class="text-xs text-neutral-500">Thread size</label>
				<select
					id="thread-size"
					class="rounded bg-neutral-800 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
					value={config.feet.threadSize}
					onchange={(e) => tableStore.updateFeetThreadSize((e.target as HTMLSelectElement).value)}
				>
					{#each threadSizes as ts}
						<option value={ts}>{ts}</option>
					{/each}
				</select>
			</div>

			<!-- Foot/caster height -->
			<div class="flex flex-col gap-1.5">
				<div class="flex items-center justify-between">
					<label for="feet-height" class="text-xs text-neutral-500">
						{config.feet.type === 'caster' ? 'Caster height' : 'Foot height'}
					</label>
					<div class="flex items-center gap-1">
						<span class="text-xs text-neutral-400">
							{inToDisplay(config.feet.height, config.metric)} {lengthUnit(config.metric)}
						</span>
						{#if !config.metric}
							<span class="text-[10px] text-neutral-500">({toFraction(config.feet.height)}")</span>
						{/if}
					</div>
				</div>
				<input
					id="feet-height"
					type="range"
					class="accent-amber-500"
					min={0.5}
					max={6}
					step={0.25}
					value={config.feet.height}
					oninput={(e) => tableStore.updateFeetHeight(parseFloat((e.target as HTMLInputElement).value))}
				/>
			</div>

			<!-- Total height display -->
			<div class="flex items-center justify-between rounded bg-neutral-800/50 px-2 py-1.5">
				<span class="text-[10px] text-neutral-500">Total height (with feet)</span>
				<div class="flex items-center gap-1">
					<span class="text-xs text-neutral-400">
						{inToDisplay(totalHeight, config.metric)} {lengthUnit(config.metric)}
					</span>
					{#if !config.metric}
						<span class="text-[10px] text-neutral-500">({toFraction(totalHeight)}")</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
