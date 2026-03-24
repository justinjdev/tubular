<script lang="ts">
	import { tableStore, type TubeProfile } from '$lib/stores/table.svelte';
	import { ALL_PRESETS, TUBE_PRESETS, FLAT_BAR_PRESETS, GAUGE_TO_THICKNESS, type StockType, type StockPreset } from '$lib/data/tubing-presets';

	const config = $derived(tableStore.config);

	type MemberKey = 'legTube' | 'frameTube' | 'braceTube';

	const sections: { key: MemberKey; label: string }[] = [
		{ key: 'legTube', label: 'Legs' },
		{ key: 'frameTube', label: 'Frame' },
		{ key: 'braceTube', label: 'Bracing' }
	];

	const gauges = Object.keys(GAUGE_TO_THICKNESS).map(Number).sort((a, b) => a - b);

	let openSection = $state<MemberKey | null>('legTube');

	function toggle(key: MemberKey) {
		openSection = openSection === key ? null : key;
	}

	function presetsForType(st: StockType): StockPreset[] {
		return st === 'flat-bar' ? FLAT_BAR_PRESETS : TUBE_PRESETS;
	}

	function findPresetIndex(tube: TubeProfile): number {
		const presets = presetsForType(tube.stockType);
		return presets.findIndex(
			(p) => p.width === tube.width && p.height === tube.height && p.thickness === tube.thickness
		);
	}

	function findGauge(thickness: number): number | null {
		for (const [g, t] of Object.entries(GAUGE_TO_THICKNESS)) {
			if (Math.abs(t - thickness) < 0.001) return Number(g);
		}
		return null;
	}

	function handleStockTypeChange(member: MemberKey, newType: StockType) {
		const presets = presetsForType(newType);
		const first = presets[0];
		tableStore.updateTube(member, {
			width: first.width,
			height: first.height,
			thickness: first.thickness,
			stockType: newType
		});
	}

	function handlePresetChange(member: MemberKey, e: Event) {
		const tube = config[member];
		const presets = presetsForType(tube.stockType);
		const idx = parseInt((e.target as HTMLSelectElement).value);
		if (idx >= 0 && idx < presets.length) {
			const p = presets[idx];
			tableStore.updateTube(member, { width: p.width, height: p.height, thickness: p.thickness, stockType: p.type });
		}
	}

	function handleCustom(member: MemberKey, field: 'width' | 'height' | 'thickness', e: Event) {
		const val = parseFloat((e.target as HTMLInputElement).value);
		if (isNaN(val) || val <= 0) return;
		const current = config[member];
		tableStore.updateTube(member, { ...current, [field]: val });
	}

	function handleGaugeChange(member: MemberKey, e: Event) {
		const gauge = parseInt((e.target as HTMLSelectElement).value);
		const thickness = GAUGE_TO_THICKNESS[gauge];
		if (thickness != null) {
			const current = config[member];
			tableStore.updateTube(member, { ...current, thickness });
		}
	}
</script>

<div class="flex flex-col gap-1">
	{#each sections as sec}
		{@const tube = config[sec.key]}
		{@const isOpen = openSection === sec.key}
		{@const presets = presetsForType(tube.stockType)}
		{@const presetIdx = findPresetIndex(tube)}
		{@const gauge = tube.stockType === 'tube' ? findGauge(tube.thickness) : null}

		<div class="overflow-hidden rounded border border-neutral-800">
			<button
				class="flex w-full items-center justify-between bg-neutral-800/50 px-3 py-2 text-left text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
				onclick={() => toggle(sec.key)}
			>
				<span>{sec.label}</span>
				<span class="text-xs text-neutral-500">
					{tube.stockType === 'flat-bar' ? 'Flat' : 'Tube'} — {tube.width}" × {tube.height}"
				</span>
				<svg
					class="h-4 w-4 text-neutral-500 transition-transform {isOpen ? 'rotate-180' : ''}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if isOpen}
				<div class="flex flex-col gap-3 bg-neutral-900/50 p-3">
					<!-- Stock type toggle -->
					<div class="flex gap-1">
						<button
							class="flex-1 rounded px-2 py-1 text-xs font-medium transition-colors {tube.stockType === 'tube' ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}"
							onclick={() => handleStockTypeChange(sec.key, 'tube')}
						>
							Tube
						</button>
						<button
							class="flex-1 rounded px-2 py-1 text-xs font-medium transition-colors {tube.stockType === 'flat-bar' ? 'bg-amber-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'}"
							onclick={() => handleStockTypeChange(sec.key, 'flat-bar')}
						>
							Flat Bar
						</button>
					</div>

					<!-- Preset dropdown -->
					<div class="flex flex-col gap-1">
						<label class="text-xs text-neutral-500" for="preset-{sec.key}">Preset</label>
						<select
							id="preset-{sec.key}"
							class="rounded bg-neutral-800 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
							value={presetIdx >= 0 ? presetIdx : ''}
							onchange={(e) => handlePresetChange(sec.key, e)}
						>
							{#if presetIdx < 0}
								<option value="" disabled>Custom</option>
							{/if}
							{#each presets as preset, i}
								<option value={i}>{preset.label}</option>
							{/each}
						</select>
					</div>

					<!-- Custom overrides -->
					<div class="grid grid-cols-2 gap-2">
						<div class="flex flex-col gap-1">
							<label class="text-xs text-neutral-500" for="tube-w-{sec.key}">Width (in)</label>
							<input
								id="tube-w-{sec.key}"
								type="number"
								class="rounded bg-neutral-800 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
								value={tube.width}
								min={0.25}
								max={6}
								step={0.125}
								oninput={(e) => handleCustom(sec.key, 'width', e)}
							/>
						</div>
						<div class="flex flex-col gap-1">
							<label class="text-xs text-neutral-500" for="tube-h-{sec.key}">
								{tube.stockType === 'flat-bar' ? 'Thickness (in)' : 'Height (in)'}
							</label>
							<input
								id="tube-h-{sec.key}"
								type="number"
								class="rounded bg-neutral-800 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
								value={tube.height}
								min={tube.stockType === 'flat-bar' ? 0.0625 : 0.5}
								max={6}
								step={tube.stockType === 'flat-bar' ? 0.0625 : 0.25}
								oninput={(e) => handleCustom(sec.key, 'height', e)}
							/>
						</div>
					</div>

					<!-- Wall thickness (tube only) -->
					{#if tube.stockType === 'tube'}
						<div class="flex flex-col gap-1">
							<span class="text-xs text-neutral-500">Wall Thickness</span>
							<div class="grid grid-cols-2 gap-2">
								<div class="flex flex-col gap-1">
									<span class="text-[10px] text-neutral-600">Gauge</span>
									<select
										class="rounded bg-neutral-800 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
										value={gauge ?? ''}
										onchange={(e) => handleGaugeChange(sec.key, e)}
									>
										{#if gauge == null}
											<option value="" disabled>Custom</option>
										{/if}
										{#each gauges as g}
											<option value={g}>{g} ga ({GAUGE_TO_THICKNESS[g]}")</option>
										{/each}
									</select>
								</div>
								<div class="flex flex-col gap-1">
									<span class="text-[10px] text-neutral-600">Decimal (in)</span>
									<input
										type="number"
										class="rounded bg-neutral-800 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
										value={tube.thickness}
										min={0.02}
										max={0.5}
										step={0.005}
										oninput={(e) => handleCustom(sec.key, 'thickness', e)}
									/>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>
