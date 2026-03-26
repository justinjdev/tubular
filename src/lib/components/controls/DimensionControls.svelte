<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { toFraction } from '$lib/utils/fractions';

	const config = $derived(tableStore.config);

	const dims = [
		{ key: 'width' as const, label: 'Width', axis: 'X' },
		{ key: 'depth' as const, label: 'Depth', axis: 'Y' },
		{ key: 'height' as const, label: 'Height', axis: 'Z' }
	];

	function displayValue(inches: number): string {
		if (config.metric) {
			return (inches * 25.4).toFixed(0);
		}
		return String(inches);
	}

	function parseInput(raw: string): number {
		const v = config.metric ? parseFloat(raw) / 25.4 : parseFloat(raw);
		return isNaN(v) ? 12 : v;
	}

	function handleChange(key: 'width' | 'depth' | 'height', e: Event) {
		const target = e.target as HTMLInputElement;
		tableStore.updateDimension(key, parseInput(target.value));
	}

	function handleRange(key: 'width' | 'depth' | 'height', e: Event) {
		const target = e.target as HTMLInputElement;
		tableStore.updateDimension(key, parseFloat(target.value));
	}
</script>

<div class="flex flex-col gap-3">
	{#each dims as dim}
		<div class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between">
				<label for="dim-{dim.key}" class="text-xs font-medium text-neutral-500">
					{dim.label}
					<span class="text-neutral-600">({dim.axis})</span>
				</label>
				<div class="flex items-center gap-1">
					<input
						id="dim-{dim.key}"
						type="number"
						class="w-20 rounded bg-neutral-800 px-2 py-1 text-right text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
						value={displayValue(config[dim.key])}
						step={config.metric ? 1 : 0.5}
						onchange={(e) => handleChange(dim.key, e)}
					/>
					<span class="text-xs text-neutral-500">{config.metric ? 'mm' : 'in'}</span>
				</div>
			</div>
			{#if !config.metric}
				<span class="text-[10px] text-neutral-500">{toFraction(config[dim.key])}"</span>
			{/if}
			<input
				type="range"
				class="accent-amber-500"
				min={12}
				max={120}
				step={0.5}
				value={config[dim.key]}
				oninput={(e) => handleRange(dim.key, e)}
			/>
		</div>
	{/each}
</div>
