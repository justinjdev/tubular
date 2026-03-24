<script lang="ts">
	import { tableStore, type TubeProfile } from '$lib/stores/table.svelte';
	import { TUBING_PRESETS, GAUGE_TO_THICKNESS } from '$lib/data/tubing-presets';

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

	function findPresetIndex(tube: TubeProfile): number {
		return TUBING_PRESETS.findIndex(
			(p) => p.width === tube.width && p.height === tube.height && p.thickness === tube.thickness
		);
	}

	function findGauge(thickness: number): number | null {
		for (const [g, t] of Object.entries(GAUGE_TO_THICKNESS)) {
			if (Math.abs(t - thickness) < 0.001) return Number(g);
		}
		return null;
	}

	function handlePresetChange(member: MemberKey, e: Event) {
		const idx = parseInt((e.target as HTMLSelectElement).value);
		if (idx >= 0 && idx < TUBING_PRESETS.length) {
			const p = TUBING_PRESETS[idx];
			tableStore.updateTube(member, { width: p.width, height: p.height, thickness: p.thickness });
		}
	}

	function handleCustom(member: MemberKey, field: keyof TubeProfile, e: Event) {
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

<section class="flex flex-col gap-1">
	<h3 class="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-400">Tubing</h3>

	{#each sections as sec}
		{@const tube = config[sec.key]}
		{@const isOpen = openSection === sec.key}
		{@const presetIdx = findPresetIndex(tube)}
		{@const gauge = findGauge(tube.thickness)}

		<div class="overflow-hidden rounded border border-neutral-800">
			<button
				class="flex w-full items-center justify-between bg-neutral-800/50 px-3 py-2 text-left text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
				onclick={() => toggle(sec.key)}
			>
				<span>{sec.label}</span>
				<span class="text-xs text-neutral-500">
					{tube.width}" × {tube.height}" — {tube.thickness}"
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
							{#each TUBING_PRESETS as preset, i}
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
								min={0.5}
								max={6}
								step={0.25}
								oninput={(e) => handleCustom(sec.key, 'width', e)}
							/>
						</div>
						<div class="flex flex-col gap-1">
							<label class="text-xs text-neutral-500" for="tube-h-{sec.key}">Height (in)</label>
							<input
								id="tube-h-{sec.key}"
								type="number"
								class="rounded bg-neutral-800 px-2 py-1.5 text-sm text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
								value={tube.height}
								min={0.5}
								max={6}
								step={0.25}
								oninput={(e) => handleCustom(sec.key, 'height', e)}
							/>
						</div>
					</div>

					<!-- Wall thickness: gauge + decimal -->
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
				</div>
			{/if}
		</div>
	{/each}
</section>
