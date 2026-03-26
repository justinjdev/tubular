<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeCutList } from '$lib/utils/cut-list';
	import { computeMaterials } from '$lib/utils/materials';
	import { ftToDisplay, lengthLongUnit, lbToDisplay, weightUnit } from '$lib/utils/units';
	import { MATERIAL_GRADES } from '$lib/data/material-grades';

	const config = $derived(tableStore.config);
	const selectedGrade = $derived(MATERIAL_GRADES.find(g => g.grade === config.materialGrade) ?? MATERIAL_GRADES[0]);
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

	const m = $derived(config.metric);

	// --- Welding Consumables ---
	const totalJoints = $derived(
		items.reduce((sum, item) => sum + item.quantity * 2, 0)
	);
	const avgWeldPerJoint = $derived(() => {
		if (items.length === 0) return 4;
		const ft = config.frameTube;
		if (ft.stockType === 'round') return Math.PI * ft.width;
		return 2 * (ft.width + ft.height);
	});
	const totalWeldInches = $derived(totalJoints * avgWeldPerJoint());
	const wireConsumptionLb = $derived(totalWeldInches / 100);
	const gasConsumptionCf = $derived(totalWeldInches * 25 * (30 / 3600));

	let wireCostPerLb: number | undefined = $state(undefined);
	let gasCostPerCf: number | undefined = $state(undefined);

	const consumablesCost = $derived(
		(wireCostPerLb !== undefined ? wireConsumptionLb * wireCostPerLb : 0) +
		(gasCostPerCf !== undefined ? gasConsumptionCf * gasCostPerCf : 0)
	);
	const hasConsumablesCost = $derived(wireCostPerLb !== undefined || gasCostPerCf !== undefined);

	// --- Hardware Costs ---
	const feetType = $derived(config?.feet?.type ?? 'none');
	const feetCount = $derived(
		feetType !== 'none' ? 4 + (config?.centerSupports ?? 0) * 2 : 0
	);
	const totalDrawerCount = $derived(
		(config?.drawers ?? []).reduce(
			(sum: number, bay: { drawers: { height: number }[] }) => sum + (bay?.drawers?.length ?? 0), 0
		)
	);
	const slidePairsCount = $derived(totalDrawerCount);

	let feetCostEach: number | undefined = $state(undefined);
	let slideCostPerPair: number | undefined = $state(undefined);
	let fastenerAllowance: number | undefined = $state(undefined);

	const hardwareCost = $derived(
		(feetCostEach !== undefined && feetCount > 0 ? feetCount * feetCostEach : 0) +
		(slideCostPerPair !== undefined && slidePairsCount > 0 ? slidePairsCount * slideCostPerPair : 0) +
		(fastenerAllowance ?? 0)
	);
	const hasHardwareCost = $derived(
		(feetCostEach !== undefined && feetCount > 0) ||
		(slideCostPerPair !== undefined && slidePairsCount > 0) ||
		(fastenerAllowance !== undefined && fastenerAllowance > 0)
	);

	// --- Finish Cost ---
	const surfaceFinish = $derived(config?.surfaceFinish ?? 'raw');
	const surfaceAreaSqIn = $derived(
		items.reduce((sum, item) => {
			let perim: number;
			if (item.stockType === 'round') {
				perim = Math.PI * item.width;
			} else {
				perim = 2 * (item.width + item.height);
			}
			return sum + perim * item.length * item.quantity;
		}, 0)
	);
	const surfaceAreaSqFt = $derived(surfaceAreaSqIn / 144);

	let powderCoatPerSqFt: number | undefined = $state(undefined);
	let paintFlatRate: number | undefined = $state(undefined);
	let galvanizedPerLb: number | undefined = $state(undefined);

	const finishCost = $derived(() => {
		if (surfaceFinish === 'powder-coat' && powderCoatPerSqFt !== undefined)
			return surfaceAreaSqFt * powderCoatPerSqFt;
		if ((surfaceFinish === 'paint' || surfaceFinish === 'oil-wax') && paintFlatRate !== undefined)
			return paintFlatRate;
		if (surfaceFinish === 'galvanized' && galvanizedPerLb !== undefined)
			return materials.totalWeight * galvanizedPerLb;
		return 0;
	});
	const hasFinishCost = $derived(finishCost() > 0);

	// --- Labor Estimate ---
	let shopRate: number | undefined = $state(undefined);
	const uniqueCuts = $derived(items.length);

	let cuttingHrs: number = $state(0);
	let weldingHrs: number = $state(0);
	let finishingHrs: number = $state(0);
	let assemblyHrs: number = $state(0.25);

	const defaultCuttingHrs = $derived(0.5 + 0.1 * uniqueCuts);
	const defaultWeldingHrs = $derived(0.5 + 0.15 * totalJoints);
	const defaultFinishingHrs = $derived(
		surfaceFinish === 'powder-coat' ? 1 :
		surfaceFinish === 'paint' || surfaceFinish === 'oil-wax' ? 0.5 :
		0
	);

	$effect(() => { cuttingHrs = defaultCuttingHrs; });
	$effect(() => { weldingHrs = defaultWeldingHrs; });
	$effect(() => { finishingHrs = defaultFinishingHrs; });

	const totalLaborHrs = $derived(cuttingHrs + weldingHrs + finishingHrs + assemblyHrs);
	const laborCost = $derived(shopRate !== undefined ? totalLaborHrs * shopRate : 0);
	const hasLaborCost = $derived(shopRate !== undefined);

	// --- Grand Total ---
	const grandTotal = $derived(
		materials.totalCost +
		(hasConsumablesCost ? consumablesCost : 0) +
		(hasHardwareCost ? hardwareCost : 0) +
		(hasFinishCost ? finishCost() : 0) +
		(hasLaborCost ? laborCost : 0)
	);
	const hasAnyCost = $derived(
		materials.totalCost > 0 || hasConsumablesCost || hasHardwareCost || hasFinishCost || hasLaborCost
	);

	function parseOptional(e: Event): number | undefined {
		const v = parseFloat((e.target as HTMLInputElement).value);
		return isNaN(v) || v <= 0 ? undefined : v;
	}

	function parseNumber(e: Event, fallback: number): number {
		const v = parseFloat((e.target as HTMLInputElement).value);
		return isNaN(v) || v < 0 ? fallback : v;
	}
</script>

<section class="flex flex-col gap-3">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Materials</h3>

	<div class="rounded-lg bg-neutral-800 p-3">
		<table class="w-full text-xs">
			<thead>
				<tr class="border-b border-neutral-700 text-left text-neutral-500">
					<th class="pb-1.5 font-medium">Profile</th>
					<th class="pb-1.5 text-right font-medium">{lengthLongUnit(m)}</th>
					<th class="pb-1.5 text-right font-medium">{weightUnit(m)}</th>
					<th class="pb-1.5 text-right font-medium">$/{m ? 'm' : 'ft'}</th>
					<th class="pb-1.5 text-right font-medium">Cost</th>
				</tr>
			</thead>
			<tbody>
				{#each materials.byProfile as profile}
					<tr class="border-b border-neutral-700/50 text-neutral-300">
						<td class="py-1.5 text-neutral-400">{profile.tubeLabel}</td>
						<td class="py-1.5 text-right font-mono">{ftToDisplay(profile.totalFeet, m)}</td>
						<td class="py-1.5 text-right font-mono">{lbToDisplay(profile.weight, m)}</td>
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
			<span class="font-mono text-white">{lbToDisplay(materials.totalWeight, m)} {weightUnit(m)}</span>
		</div>
		{#if materials.totalCost > 0}
			<div class="mt-1 flex items-center justify-between text-xs">
				<span class="font-semibold text-neutral-300">Total Cost</span>
				<span class="font-mono text-amber-400">${materials.totalCost.toFixed(2)}</span>
			</div>
		{/if}
	</div>

	<!-- Material grade info -->
	<div class="mt-3 rounded bg-neutral-700/50 px-3 py-2 text-xs">
		<div class="flex items-center justify-between">
			<span class="font-semibold text-neutral-300">{selectedGrade.name}</span>
			<span class="text-neutral-500">{selectedGrade.description}</span>
		</div>
		<div class="mt-1 text-neutral-400">Filler: {selectedGrade.fillerWire}</div>
	</div>

	<!-- Welding Consumables -->
	<details class="group">
		<summary class="cursor-pointer text-[10px] font-medium uppercase tracking-wider text-neutral-500 select-none">
			Welding Consumables
			{#if hasConsumablesCost}
				<span class="ml-1 font-mono text-amber-400/70 normal-case">${consumablesCost.toFixed(2)}</span>
			{/if}
		</summary>
		<div class="mt-2 rounded-lg bg-neutral-800/50 p-3">
			<p class="mb-2 text-[10px] italic text-neutral-600">Estimates based on {totalJoints} joints, ~{totalWeldInches.toFixed(0)}" total weld</p>
			<div class="flex flex-col gap-2 text-xs">
				<div class="flex items-center justify-between">
					<span class="text-neutral-400">Wire ({wireConsumptionLb.toFixed(2)} lb est.)</span>
					<div class="flex items-center gap-1.5">
						<span class="text-[10px] text-neutral-600">$/lb</span>
						<input
							type="number"
							class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
							placeholder="—"
							step="0.01"
							min="0"
							value={wireCostPerLb ?? ''}
							oninput={(e) => { wireCostPerLb = parseOptional(e); }}
						/>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-neutral-400">Gas ({gasConsumptionCf.toFixed(1)} cf est.)</span>
					<div class="flex items-center gap-1.5">
						<span class="text-[10px] text-neutral-600">$/cf</span>
						<input
							type="number"
							class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
							placeholder="—"
							step="0.01"
							min="0"
							value={gasCostPerCf ?? ''}
							oninput={(e) => { gasCostPerCf = parseOptional(e); }}
						/>
					</div>
				</div>
			</div>
			<p class="mt-2 text-[10px] italic text-neutral-600">ER70S-6 ~$3/lb, C25 mix ~$0.50/cf</p>
		</div>
	</details>

	<!-- Hardware Costs -->
	{#if feetCount > 0 || totalDrawerCount > 0}
		<details class="group">
			<summary class="cursor-pointer text-[10px] font-medium uppercase tracking-wider text-neutral-500 select-none">
				Hardware
				{#if hasHardwareCost}
					<span class="ml-1 font-mono text-amber-400/70 normal-case">${hardwareCost.toFixed(2)}</span>
				{/if}
			</summary>
			<div class="mt-2 rounded-lg bg-neutral-800/50 p-3">
				<div class="flex flex-col gap-2 text-xs">
					{#if feetCount > 0}
						<div class="flex items-center justify-between">
							<span class="text-neutral-400">{feetType === 'caster' ? 'Casters' : 'Leveling Feet'} ({feetCount})</span>
							<div class="flex items-center gap-1.5">
								<span class="text-[10px] text-neutral-600">$/ea</span>
								<input
									type="number"
									class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
									placeholder="—"
									step="0.01"
									min="0"
									value={feetCostEach ?? ''}
									oninput={(e) => { feetCostEach = parseOptional(e); }}
								/>
							</div>
						</div>
					{/if}
					{#if totalDrawerCount > 0}
						<div class="flex items-center justify-between">
							<span class="text-neutral-400">Drawer Slides ({slidePairsCount} pair{slidePairsCount !== 1 ? 's' : ''})</span>
							<div class="flex items-center gap-1.5">
								<span class="text-[10px] text-neutral-600">$/pair</span>
								<input
									type="number"
									class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
									placeholder="—"
									step="0.01"
									min="0"
									value={slideCostPerPair ?? ''}
									oninput={(e) => { slideCostPerPair = parseOptional(e); }}
								/>
							</div>
						</div>
					{/if}
					<div class="flex items-center justify-between">
						<span class="text-neutral-400">Bolts / Fasteners</span>
						<div class="flex items-center gap-1.5">
							<span class="text-[10px] text-neutral-600">$/table</span>
							<input
								type="number"
								class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
								placeholder="—"
								step="0.01"
								min="0"
								value={fastenerAllowance ?? ''}
								oninput={(e) => { fastenerAllowance = parseOptional(e); }}
							/>
						</div>
					</div>
				</div>
			</div>
		</details>
	{/if}

	<!-- Finish Cost -->
	{#if surfaceFinish !== 'raw'}
		<details class="group">
			<summary class="cursor-pointer text-[10px] font-medium uppercase tracking-wider text-neutral-500 select-none">
				Finish ({surfaceFinish})
				{#if hasFinishCost}
					<span class="ml-1 font-mono text-amber-400/70 normal-case">${finishCost().toFixed(2)}</span>
				{/if}
			</summary>
			<div class="mt-2 rounded-lg bg-neutral-800/50 p-3">
				<div class="flex flex-col gap-2 text-xs">
					{#if surfaceFinish === 'powder-coat'}
						<p class="text-[10px] italic text-neutral-600">Surface area: ~{surfaceAreaSqFt.toFixed(1)} sq ft</p>
						<div class="flex items-center justify-between">
							<span class="text-neutral-400">Powder Coat</span>
							<div class="flex items-center gap-1.5">
								<span class="text-[10px] text-neutral-600">$/sq ft</span>
								<input
									type="number"
									class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
									placeholder="—"
									step="0.01"
									min="0"
									value={powderCoatPerSqFt ?? ''}
									oninput={(e) => { powderCoatPerSqFt = parseOptional(e); }}
								/>
							</div>
						</div>
					{:else if surfaceFinish === 'paint' || surfaceFinish === 'oil-wax'}
						<div class="flex items-center justify-between">
							<span class="text-neutral-400">{surfaceFinish === 'paint' ? 'Paint' : 'Oil/Wax'} (flat rate)</span>
							<div class="flex items-center gap-1.5">
								<span class="text-[10px] text-neutral-600">$/table</span>
								<input
									type="number"
									class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
									placeholder="—"
									step="0.01"
									min="0"
									value={paintFlatRate ?? ''}
									oninput={(e) => { paintFlatRate = parseOptional(e); }}
								/>
							</div>
						</div>
					{:else if surfaceFinish === 'galvanized'}
						<p class="text-[10px] italic text-neutral-600">Total weight: {lbToDisplay(materials.totalWeight, m)} {weightUnit(m)}</p>
						<div class="flex items-center justify-between">
							<span class="text-neutral-400">Hot-dip Galvanize</span>
							<div class="flex items-center gap-1.5">
								<span class="text-[10px] text-neutral-600">$/lb</span>
								<input
									type="number"
									class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
									placeholder="—"
									step="0.01"
									min="0"
									value={galvanizedPerLb ?? ''}
									oninput={(e) => { galvanizedPerLb = parseOptional(e); }}
								/>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</details>
	{/if}

	<!-- Labor Estimate -->
	<details class="group">
		<summary class="cursor-pointer text-[10px] font-medium uppercase tracking-wider text-neutral-500 select-none">
			Labor Estimate
			{#if hasLaborCost}
				<span class="ml-1 font-mono text-amber-400/70 normal-case">${laborCost.toFixed(2)}</span>
			{/if}
		</summary>
		<div class="mt-2 rounded-lg bg-neutral-800/50 p-3">
			<p class="mb-2 text-[10px] italic text-neutral-600">Rough estimates — adjust hours to match your shop</p>
			<div class="flex flex-col gap-2 text-xs">
				<div class="flex items-center justify-between">
					<span class="text-neutral-400">Shop Rate</span>
					<div class="flex items-center gap-1.5">
						<span class="text-[10px] text-neutral-600">$/hr</span>
						<input
							type="number"
							class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
							placeholder="—"
							step="1"
							min="0"
							value={shopRate ?? ''}
							oninput={(e) => { shopRate = parseOptional(e); }}
						/>
					</div>
				</div>
				<div class="mt-1 border-t border-neutral-700/50 pt-2">
					<div class="flex items-center justify-between">
						<span class="text-neutral-400">Cutting</span>
						<input
							type="number"
							class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
							step="0.25"
							min="0"
							value={cuttingHrs}
							oninput={(e) => { cuttingHrs = parseNumber(e, defaultCuttingHrs); }}
						/>
					</div>
					<div class="mt-1 flex items-center justify-between">
						<span class="text-neutral-400">Welding</span>
						<input
							type="number"
							class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
							step="0.25"
							min="0"
							value={weldingHrs}
							oninput={(e) => { weldingHrs = parseNumber(e, defaultWeldingHrs); }}
						/>
					</div>
					{#if surfaceFinish !== 'raw'}
						<div class="mt-1 flex items-center justify-between">
							<span class="text-neutral-400">Finishing</span>
							<input
								type="number"
								class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
								step="0.25"
								min="0"
								value={finishingHrs}
								oninput={(e) => { finishingHrs = parseNumber(e, defaultFinishingHrs); }}
							/>
						</div>
					{/if}
					<div class="mt-1 flex items-center justify-between">
						<span class="text-neutral-400">Assembly</span>
						<input
							type="number"
							class="w-14 rounded bg-neutral-900 px-1.5 py-0.5 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
							step="0.25"
							min="0"
							value={assemblyHrs}
							oninput={(e) => { assemblyHrs = parseNumber(e, 0.25); }}
						/>
					</div>
				</div>
				<div class="mt-1 flex items-center justify-between border-t border-neutral-700/50 pt-2">
					<span class="font-semibold text-neutral-300">Total Hours</span>
					<span class="font-mono text-white">{totalLaborHrs.toFixed(2)} hr</span>
				</div>
			</div>
		</div>
	</details>

	<!-- Grand Total -->
	{#if hasAnyCost}
		<div class="rounded-lg bg-neutral-800 p-3">
			<div class="flex items-center justify-between text-sm">
				<span class="font-bold text-neutral-200">Estimated Total</span>
				<span class="font-mono text-lg font-bold text-amber-400">${grandTotal.toFixed(2)}</span>
			</div>
			<p class="mt-1 text-[10px] italic text-neutral-600">Includes only categories with cost inputs filled in</p>
		</div>
	{/if}
</section>
