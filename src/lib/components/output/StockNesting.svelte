<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeCutList } from '$lib/utils/cut-list';
	import {
		computeNesting,
		profileKey,
		STOCK_LENGTHS_INCHES,
		stockLengthLabel
	} from '$lib/utils/stock-nesting';
	import { inToDisplay, lengthUnit } from '$lib/utils/units';

	const config = $derived(tableStore.config);
	const items = $derived(computeCutList(config));
	const m = $derived(config.metric);

	// Stock length selection per profile key
	let stockLengths = $state<Record<string, number>>({});

	const nesting = $derived(computeNesting(items, stockLengths));

	function handleStockLength(key: string, e: Event) {
		const val = parseInt((e.target as HTMLSelectElement).value);
		stockLengths = { ...stockLengths, [key]: val };
	}
</script>

<section class="flex flex-col gap-3">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Stock Nesting</h3>

	{#each nesting.profiles as profile}
		{@const key = `${profile.stockType}-${profile.width}-${profile.height}-${profile.thickness}`}

		<div class="rounded-lg bg-neutral-800 p-3">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-xs font-medium text-neutral-300">{profile.tubeLabel}</span>
				<select
					class="rounded bg-neutral-700 px-2 py-1 text-xs text-white outline-none ring-1 ring-neutral-600 focus:ring-amber-500"
					value={stockLengths[key] ?? 96}
					onchange={(e) => handleStockLength(key, e)}
				>
					{#each STOCK_LENGTHS_INCHES as sl}
						<option value={sl}>{stockLengthLabel(sl, m)} stock</option>
					{/each}
				</select>
			</div>

			<!-- Summary -->
			<div class="mb-2 flex gap-3 text-xs text-neutral-400">
				<span><strong class="text-white">{profile.totalSticks}</strong> sticks</span>
				<span>waste <strong class="text-amber-400">{profile.wastePercent.toFixed(0)}%</strong></span>
			</div>

			<!-- Stick diagram -->
			<div class="flex flex-col gap-1.5">
				{#each profile.sticks as stick, i}
					{@const pct = (stick.used / profile.stockLength) * 100}
					<div class="flex flex-col gap-0.5">
						<div class="flex h-5 w-full overflow-hidden rounded bg-neutral-900">
							{#each stick.pieces as piece}
								{@const w = (piece.length / profile.stockLength) * 100}
								<div
									class="flex h-full items-center justify-center border-r border-neutral-900 bg-amber-600/80 text-[9px] font-medium text-white"
									style="width: {w}%"
									title="{piece.description}: {inToDisplay(piece.length, m)} {lengthUnit(m)}"
								>
									{#if w > 8}
										{inToDisplay(piece.length, m, 0)}
									{/if}
								</div>
							{/each}
							{#if stick.waste > 0}
								<div
									class="flex h-full flex-1 items-center justify-center text-[9px] text-neutral-600"
									title="Waste: {inToDisplay(stick.waste, m)} {lengthUnit(m)}"
								>
									{#if (stick.waste / profile.stockLength) * 100 > 8}
										{inToDisplay(stick.waste, m, 0)}
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/each}

	{#if nesting.profiles.length === 0}
		<p class="text-xs text-neutral-500">Add dimensions and bracing to see stock nesting.</p>
	{/if}
</section>
