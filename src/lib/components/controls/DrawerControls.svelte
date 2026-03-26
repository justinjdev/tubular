<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeBays, computeDrawerCutList } from '$lib/utils/drawer-cut-list';
	import { toFraction } from '$lib/utils/fractions';

	const config = $derived(tableStore.config);
	const bays = $derived(computeBays(config));
	const drawerInfo = $derived(computeDrawerCutList(config));
	const numBays = $derived(config.centerSupports + 1);

	const legHeight = $derived(config.height - config.frameTube.height - config.footAllowance);

	function usedHeight(bayIndex: number): number {
		const bayDrawers = config.drawers[bayIndex]?.drawers ?? [];
		return bayDrawers.reduce((sum, d) => sum + d.height + 0.5, 0);
	}

	function remainingHeight(bayIndex: number): number {
		return legHeight - usedHeight(bayIndex);
	}
</script>

<div class="flex flex-col gap-3">
	<!-- Global drawer settings (collapsible) -->
	<details class="group">
		<summary class="flex cursor-pointer items-center gap-1.5 text-[10px] uppercase tracking-wide text-neutral-500 hover:text-neutral-400">
			<svg class="h-2.5 w-2.5 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 8 12"><path d="M1.5 0L7.5 6L1.5 12z" /></svg>
			Slide &amp; Material Settings
		</summary>
		<div class="mt-2 flex flex-col gap-2 rounded-lg bg-neutral-800/30 p-3">

		<div class="flex items-center justify-between">
			<label for="slide-gap" class="text-xs text-neutral-500">Slide Gap (per side)</label>
			<div class="flex items-center gap-1">
				<input
					id="slide-gap"
					type="number"
					class="w-16 rounded bg-neutral-800 px-2 py-1 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
					value={config.drawerSlideGap}
					min={0.25}
					max={1}
					step={0.125}
					onchange={(e) => tableStore.updateDrawerSlideGap(parseFloat((e.target as HTMLInputElement).value))}
				/>
				<span class="text-[10px] text-neutral-500">in</span>
			</div>
		</div>

		<div class="flex items-center justify-between">
			<label for="drawer-depth" class="text-xs text-neutral-500">Drawer Depth</label>
			<div class="flex items-center gap-1">
				<input
					id="drawer-depth"
					type="number"
					class="w-16 rounded bg-neutral-800 px-2 py-1 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
					value={config.drawerDepth}
					min={6}
					max={48}
					step={0.5}
					onchange={(e) => tableStore.updateDrawerDepth(parseFloat((e.target as HTMLInputElement).value))}
				/>
				<span class="text-[10px] text-neutral-500">in</span>
			</div>
		</div>

		<div class="flex items-center justify-between">
			<label for="front-inset" class="text-xs text-neutral-500">Front Inset</label>
			<div class="flex items-center gap-1">
				<input
					id="front-inset"
					type="number"
					class="w-16 rounded bg-neutral-800 px-2 py-1 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
					value={config.drawerFrontInset}
					min={0}
					max={6}
					step={0.25}
					onchange={(e) => tableStore.updateDrawerFrontInset(parseFloat((e.target as HTMLInputElement).value))}
				/>
				<span class="text-[10px] text-neutral-500">in</span>
			</div>
		</div>

		<div class="flex items-center justify-between">
			<label for="side-thickness" class="text-xs text-neutral-500">Sides/Front/Back</label>
			<select
				id="side-thickness"
				class="rounded bg-neutral-800 px-2 py-1 text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
				value={config.drawerSideThickness}
				onchange={(e) => tableStore.updateDrawerSideThickness(parseFloat((e.target as HTMLSelectElement).value))}
			>
				<option value={0.375}>3/8"</option>
				<option value={0.5}>1/2"</option>
				<option value={0.625}>5/8"</option>
				<option value={0.75}>3/4"</option>
			</select>
		</div>

		<div class="flex items-center justify-between">
			<label for="bottom-thickness" class="text-xs text-neutral-500">Bottom Panel</label>
			<select
				id="bottom-thickness"
				class="rounded bg-neutral-800 px-2 py-1 text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
				value={config.drawerBottomThickness}
				onchange={(e) => tableStore.updateDrawerBottomThickness(parseFloat((e.target as HTMLSelectElement).value))}
			>
				<option value={0.1875}>3/16"</option>
				<option value={0.25}>1/4"</option>
				<option value={0.375}>3/8"</option>
				<option value={0.5}>1/2"</option>
			</select>
		</div>
		<div class="flex items-center justify-between">
			<label for="slide-mount" class="text-xs text-neutral-500">Slide Mounts</label>
			<select
				id="slide-mount"
				class="rounded bg-neutral-800 px-2 py-1 text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
				value={`${config.drawerSlideMount}|${config.drawerSlideMountSize}`}
				onchange={(e) => {
					const [mount, size] = (e.target as HTMLSelectElement).value.split('|');
					tableStore.updateDrawerSlideMount(mount as 'angle-iron' | 'flat-bar' | 'hardwood', size);
				}}
			>
				<optgroup label="Angle Iron">
					<option value="angle-iron|3/4×3/4×1/8">3/4" × 3/4" × 1/8" angle</option>
					<option value="angle-iron|1×1×1/8">1" × 1" × 1/8" angle</option>
					<option value="angle-iron|1×1×3/16">1" × 1" × 3/16" angle</option>
					<option value="angle-iron|1-1/4×1-1/4×1/8">1-1/4" × 1-1/4" × 1/8" angle</option>
					<option value="angle-iron|1-1/2×1-1/2×1/8">1-1/2" × 1-1/2" × 1/8" angle</option>
				</optgroup>
				<optgroup label="Flat Bar">
					<option value="flat-bar|1×1/8">1" × 1/8" flat bar</option>
					<option value="flat-bar|1×3/16">1" × 3/16" flat bar</option>
					<option value="flat-bar|1-1/2×1/8">1-1/2" × 1/8" flat bar</option>
					<option value="flat-bar|1-1/2×3/16">1-1/2" × 3/16" flat bar</option>
				</optgroup>
				<optgroup label="Hardwood">
					<option value="hardwood|3/4×3/4">3/4" × 3/4" hardwood cleat</option>
					<option value="hardwood|3/4×1-1/2">3/4" × 1-1/2" hardwood cleat</option>
				</optgroup>
			</select>
		</div>
		</div>
	</details>

	<!-- Per-bay drawer config -->
	{#each bays as bay, i}
		{@const bayDrawers = config.drawers[i]?.drawers ?? []}
		{@const remaining = remainingHeight(i)}
		<div class="flex flex-col gap-2 rounded-lg bg-neutral-800/50 p-3">
			<div class="flex items-center justify-between">
				<span class="text-xs font-medium text-neutral-300">
					Bay {i + 1}{numBays > 1 ? ` of ${numBays}` : ''}
				</span>
				<span class="text-[10px] text-neutral-500">
					{toFraction(bay.bayWidth)}" wide
				</span>
			</div>

			{#each bayDrawers as drawer, di}
				<div class="flex items-center gap-2">
					<span class="w-14 shrink-0 text-[10px] text-neutral-500">Drawer {di + 1}</span>
					<input
						type="number"
						class="w-16 rounded bg-neutral-800 px-2 py-1 text-right text-xs text-white outline-none ring-1 ring-neutral-700 focus:ring-amber-500"
						value={drawer.height}
						min={2}
						max={16}
						step={0.5}
						onchange={(e) => tableStore.updateDrawerHeight(i, di, parseFloat((e.target as HTMLInputElement).value))}
					/>
					<span class="text-xs text-neutral-400">{toFraction(drawer.height)}"</span>
					<button
						class="ml-auto text-xs text-neutral-600 hover:text-red-400"
						onclick={() => tableStore.removeDrawer(i, di)}
						title="Remove drawer"
					>
						&times;
					</button>
				</div>
			{/each}

			{#if remaining >= 2.5}
				<button
					class="rounded bg-neutral-700 px-2 py-1.5 text-xs text-neutral-300 transition-colors hover:bg-neutral-600"
					onclick={() => tableStore.addDrawer(i, Math.min(4, remaining - 0.5))}
				>
					+ Add Drawer
				</button>
			{:else if bayDrawers.length === 0}
				<span class="text-[10px] text-neutral-600">No drawers in this bay</span>
			{:else}
				<span class="text-[10px] text-neutral-600">Bay full</span>
			{/if}
		</div>
	{/each}

	<!-- Summary -->
	{#if drawerInfo.dimensions.length > 0}
		{@const d = drawerInfo.dimensions[0]}
		<div class="flex flex-col gap-1 rounded-lg bg-neutral-800/50 p-3 text-[10px] text-neutral-500">
			<span>Drawer box: {toFraction(d.boxWidth)}" W × {toFraction(d.boxDepth)}" D</span>
			<span>Slides: {d.slideLength}" full extension × {drawerInfo.hardware[0]?.quantity ?? 0}</span>
			<span>Panels: {drawerInfo.panels.length} types, {drawerInfo.panels.reduce((s, p) => s + p.quantity, 0)} pieces</span>
		</div>
	{/if}
</div>
