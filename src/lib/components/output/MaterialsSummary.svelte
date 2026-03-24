<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeCutList } from '$lib/utils/cut-list';
	import { computeMaterials } from '$lib/utils/materials';

	const config = $derived(tableStore.config);
	const items = $derived(computeCutList(config));

	let costPerFoot: Record<string, number> = $state({});

	const materials = $derived(computeMaterials(items, costPerFoot));

	function handleCostInput(label: string, e: Event) {
		const target = e.target as HTMLInputElement;
		const v = parseFloat(target.value);
		if (isNaN(v) || v <= 0) {
			const next = { ...costPerFoot };
			delete next[label];
			costPerFoot = next;
		} else {
			costPerFoot = { ...costPerFoot, [label]: v };
		}
	}
</script>

<section class="flex flex-col gap-3">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Materials</h3>

	<div class="rounded-lg bg-neutral-800 p-3">
		<table class="w-full text-xs">
			<thead>
				<tr class="border-b border-neutral-700 text-left text-neutral-500">
					<th class="pb-1.5 font-medium">Profile</th>
					<th class="pb-1.5 text-right font-medium">Feet</th>
					<th class="pb-1.5 text-right font-medium">Weight</th>
					<th class="pb-1.5 text-right font-medium">$/ft</th>
					<th class="pb-1.5 text-right font-medium">Cost</th>
				</tr>
			</thead>
			<tbody>
				{#each materials.byProfile as profile}
					<tr class="border-b border-neutral-700/50 text-neutral-300">
						<td class="py-1.5 text-neutral-400">{profile.tubeLabel}</td>
						<td class="py-1.5 text-right font-mono">{profile.totalFeet.toFixed(1)}</td>
						<td class="py-1.5 text-right font-mono">{profile.weight.toFixed(1)} lb</td>
						<td class="py-1.5 text-right">
							<input
								type="number"
								class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
								placeholder="—"
								step="0.01"
								min="0"
								value={costPerFoot[profile.tubeLabel] ?? ''}
								oninput={(e) => handleCostInput(profile.tubeLabel, e)}
							/>
						</td>
						<td class="py-1.5 text-right font-mono">
							{profile.totalCost !== undefined ? '$' + profile.totalCost.toFixed(2) : '—'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div class="mt-3 flex items-center justify-between border-t border-neutral-700 pt-2 text-xs">
			<span class="font-semibold text-neutral-300">Total Weight</span>
			<span class="font-mono text-white">{materials.totalWeight.toFixed(1)} lb</span>
		</div>
		{#if materials.totalCost > 0}
			<div class="mt-1 flex items-center justify-between text-xs">
				<span class="font-semibold text-neutral-300">Total Cost</span>
				<span class="font-mono text-amber-400">${materials.totalCost.toFixed(2)}</span>
			</div>
		{/if}
	</div>
</section>
