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
	let kerf = $state(0.125);

	// Custom drops (existing stock on hand) per profile key
	let customDrops = $state<Record<string, { length: number; qty: number }[]>>({});

	// Temp input state per profile key
	let dropInputLength = $state<Record<string, string>>({});
	let dropInputQty = $state<Record<string, string>>({});

	const nesting = $derived(computeNesting(items, stockLengths, kerf, customDrops));

	function handleStockLength(key: string, e: Event) {
		const val = parseInt((e.target as HTMLSelectElement).value);
		stockLengths = { ...stockLengths, [key]: val };
	}

	function addCustomDrop(key: string) {
		const rawLength = parseFloat(dropInputLength[key] ?? '');
		const rawQty = parseInt(dropInputQty[key] ?? '1');
		if (!rawLength || rawLength <= 0) return;
		const qty = rawQty > 0 ? rawQty : 1;
		// Convert from display unit to inches if metric
		const lengthInches = m ? rawLength / 25.4 : rawLength;
		const existing = customDrops[key] ?? [];
		customDrops = { ...customDrops, [key]: [...existing, { length: lengthInches, qty }] };
		dropInputLength = { ...dropInputLength, [key]: '' };
		dropInputQty = { ...dropInputQty, [key]: '1' };
	}

	function removeCustomDrop(key: string, index: number) {
		const existing = customDrops[key] ?? [];
		customDrops = { ...customDrops, [key]: existing.filter((_, i) => i !== index) };
	}
</script>

<section class="flex flex-col gap-3">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Stock Nesting</h3>

	<div class="flex items-center gap-2 text-xs text-neutral-400">
		<label for="kerf-input">Kerf (blade width):</label>
		<input
			id="kerf-input"
			type="number"
			min="0"
			step="0.0625"
			class="w-20 rounded bg-neutral-700 px-2 py-1 text-xs text-white outline-none ring-1 ring-neutral-600 focus:ring-amber-500"
			bind:value={kerf}
		/>
		<span>{m ? `${(kerf * 25.4).toFixed(1)} mm` : `${kerf}" in`}</span>
	</div>

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

			<!-- Available drops -->
			<details class="mb-2">
				<summary class="cursor-pointer text-[10px] text-neutral-500 hover:text-neutral-300">Available drops</summary>
				<div class="mt-1.5 flex flex-col gap-1.5">
					<div class="flex items-center gap-1">
						<input
							type="number"
							min="0"
							step="0.25"
							placeholder={m ? 'mm' : 'in'}
							class="w-16 rounded bg-neutral-700 px-1.5 py-0.5 text-[11px] text-white outline-none ring-1 ring-neutral-600 focus:ring-amber-500"
							value={dropInputLength[key] ?? ''}
							oninput={(e) => { dropInputLength = { ...dropInputLength, [key]: (e.target as HTMLInputElement).value }; }}
							onkeydown={(e) => { if (e.key === 'Enter') addCustomDrop(key); }}
						/>
						<span class="text-[10px] text-neutral-500">×</span>
						<input
							type="number"
							min="1"
							step="1"
							class="w-10 rounded bg-neutral-700 px-1.5 py-0.5 text-[11px] text-white outline-none ring-1 ring-neutral-600 focus:ring-amber-500"
							value={dropInputQty[key] ?? '1'}
							oninput={(e) => { dropInputQty = { ...dropInputQty, [key]: (e.target as HTMLInputElement).value }; }}
							onkeydown={(e) => { if (e.key === 'Enter') addCustomDrop(key); }}
						/>
						<button
							class="rounded bg-neutral-600 px-1.5 py-0.5 text-[11px] text-white hover:bg-neutral-500"
							onclick={() => addCustomDrop(key)}
						>+</button>
					</div>
					{#if (customDrops[key] ?? []).length > 0}
						<div class="flex flex-col gap-0.5">
							{#each customDrops[key] as drop, di}
								<div class="flex items-center gap-1.5 text-[11px] text-neutral-300">
									<span class="text-green-400">●</span>
									<span>{inToDisplay(drop.length, m)} {lengthUnit(m)} × {drop.qty}</span>
									<button
										class="text-neutral-500 hover:text-red-400"
										onclick={() => removeCustomDrop(key, di)}
									>×</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</details>

			<!-- Summary -->
			<div class="mb-2 flex gap-3 text-xs text-neutral-400">
				{#if profile.customSticks > 0}
					<span><strong class="text-green-400">{profile.customSticks}</strong> from drops, <strong class="text-white">{profile.totalSticks - profile.customSticks}</strong> new</span>
				{:else}
					<span><strong class="text-white">{profile.totalSticks}</strong> sticks</span>
				{/if}
				<span>waste <strong class="text-amber-400">{profile.wastePercent.toFixed(0)}%</strong></span>
			</div>

			<!-- Stick diagram -->
			<div class="flex flex-col gap-1.5">
				{#each profile.sticks as stick, i}
					{@const stickLen = stick.isCustomDrop ? stick.used + stick.waste : profile.stockLength}
					{@const pct = (stick.used / stickLen) * 100}
					<div class="flex flex-col gap-0.5">
						<div class="flex h-5 w-full overflow-hidden rounded bg-neutral-900 {stick.isCustomDrop ? 'border-l-2 border-green-500' : ''}">
							{#each stick.pieces as piece}
								{@const w = (piece.length / stickLen) * 100}
								<div
									class="flex h-full items-center justify-center border-r border-neutral-900 {stick.isCustomDrop ? 'bg-green-600/70' : 'bg-amber-600/80'} text-[9px] font-medium text-white"
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
									{#if (stick.waste / stickLen) * 100 > 8}
										{inToDisplay(stick.waste, m, 0)}
									{/if}
								</div>
							{/if}
						</div>
						{#if stick.isCustomDrop}
							<span class="text-[9px] text-green-500/70">drop · {inToDisplay(stickLen, m)} {lengthUnit(m)}</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}

	{#if nesting.profiles.length === 0}
		<p class="text-xs text-neutral-500">Add dimensions and bracing to see stock nesting.</p>
	{/if}
</section>
