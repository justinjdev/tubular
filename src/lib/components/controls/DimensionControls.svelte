<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';

	const config = $derived(tableStore.config);

	const dims = [
		{ key: 'length' as const, label: 'Length', axis: 'X' },
		{ key: 'width' as const, label: 'Width', axis: 'Y' },
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

	function handleInput(key: 'length' | 'width' | 'height', e: Event) {
		const target = e.target as HTMLInputElement;
		tableStore.updateDimension(key, parseInput(target.value));
	}

	function handleRange(key: 'length' | 'width' | 'height', e: Event) {
		const target = e.target as HTMLInputElement;
		tableStore.updateDimension(key, parseFloat(target.value));
	}
</script>

<section class="flex flex-col gap-4">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Dimensions</h3>
		<button
			class="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors {config.metric
				? 'bg-amber-500/20 text-amber-400'
				: 'bg-neutral-800 text-neutral-400 hover:text-neutral-300'}"
			onclick={() => tableStore.toggleMetric()}
		>
			<span class={config.metric ? 'opacity-50' : 'opacity-100'}>in</span>
			<span class="text-neutral-600">/</span>
			<span class={config.metric ? 'opacity-100' : 'opacity-50'}>mm</span>
		</button>
	</div>

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
						class="w-16 rounded bg-neutral-800 px-2 py-1 text-right text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
						value={displayValue(config[dim.key])}
						min={config.metric ? Math.round(12 * 25.4) : 12}
						max={config.metric ? Math.round(120 * 25.4) : 120}
						step={config.metric ? 25 : 1}
						oninput={(e) => handleInput(dim.key, e)}
					/>
					<span class="text-xs text-neutral-500">{config.metric ? 'mm' : 'in'}</span>
				</div>
			</div>
			<input
				type="range"
				class="accent-amber-500"
				min={12}
				max={120}
				step={1}
				value={config[dim.key]}
				oninput={(e) => handleRange(dim.key, e)}
			/>
		</div>
	{/each}
</section>
