<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeCutList, type CutListItem } from '$lib/utils/cut-list';
	import { inToDisplay, lengthUnit } from '$lib/utils/units';

	const config = $derived(tableStore.config);
	const items = $derived(computeCutList(config));

	const grouped = $derived(
		items.reduce(
			(acc, item) => {
				if (!acc[item.group]) acc[item.group] = [];
				acc[item.group].push(item);
				return acc;
			},
			{} as Record<string, CutListItem[]>
		)
	);

	function fmtLength(inches: number): string {
		return inToDisplay(inches, config.metric) + ' ' + lengthUnit(config.metric);
	}
</script>

<section class="flex flex-col gap-3">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Cut List</h3>

	{#each Object.entries(grouped) as [group, groupItems]}
		<div class="rounded-lg bg-neutral-800 p-3">
			<h4 class="mb-2 text-xs font-bold uppercase tracking-wider text-amber-500">{group}</h4>
			<table class="w-full text-xs">
				<thead>
					<tr class="border-b border-neutral-700 text-left text-neutral-500">
						<th class="pb-1.5 font-medium">Part</th>
						<th class="pb-1.5 font-medium">Tube Profile</th>
						<th class="pb-1.5 text-right font-medium">Length</th>
						<th class="pb-1.5 text-right font-medium">Qty</th>
					</tr>
				</thead>
				<tbody>
					{#each groupItems as item}
						<tr class="border-b border-neutral-700/50 text-neutral-300">
							<td class="py-1.5">
								{item.description}
								{#if item.jointNote}
									<span class="ml-1 text-[10px] text-amber-500/70">{item.jointNote}</span>
								{/if}
							</td>
							<td class="py-1.5 text-neutral-400">{item.tubeLabel}</td>
							<td class="py-1.5 text-right font-mono">{fmtLength(item.length)}</td>
							<td class="py-1.5 text-right font-mono">{item.quantity}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/each}
</section>
