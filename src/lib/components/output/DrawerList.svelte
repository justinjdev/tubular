<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeDrawerCutList } from '$lib/utils/drawer-cut-list';
	import { toFraction } from '$lib/utils/fractions';

	const config = $derived(tableStore.config);
	const drawerInfo = $derived(computeDrawerCutList(config));
	const hasDrawers = $derived(drawerInfo.dimensions.length > 0);
</script>

{#if hasDrawers}
	<section class="flex flex-col gap-3">
		<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Drawer Cut List</h3>

		<!-- Wood panels -->
		<div class="flex flex-col gap-1">
			<span class="text-[10px] uppercase tracking-wide text-neutral-500">Wood Panels</span>
			<div class="flex flex-col gap-2 text-xs">
				{#each drawerInfo.panels as panel}
					<div class="flex flex-col gap-0.5">
						<div class="flex items-center justify-between">
							<span class="text-neutral-300">{panel.description}</span>
							<span class="text-neutral-400">×{panel.quantity}</span>
						</div>
						<span class="text-neutral-500">
							{toFraction(panel.width)}" × {toFraction(panel.height)}" — {panel.material}
						</span>
						{#if panel.note}
							<span class="text-[10px] text-neutral-600">{panel.note}</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Slide mounting rails -->
		{#if drawerInfo.slideRails.quantity > 0}
			<div class="flex flex-col gap-1">
				<span class="text-[10px] uppercase tracking-wide text-neutral-500">Slide Mounting Rails</span>
				<span class="text-xs text-neutral-400">
					{drawerInfo.slideRails.quantity} × {toFraction(drawerInfo.slideRails.length)}" —
					{drawerInfo.slideRails.material} {drawerInfo.slideRails.mountType.replace('-', ' ')}
				</span>
				<span class="text-[10px] text-neutral-600">Welded/mounted to inside of legs for slide attachment</span>
			</div>
		{/if}

		<!-- Hardware -->
		<div class="flex flex-col gap-1">
			<span class="text-[10px] uppercase tracking-wide text-neutral-500">Hardware</span>
			{#each drawerInfo.hardware as hw}
				<span class="text-xs text-neutral-400">
					{hw.quantity} × {hw.description} — {hw.spec}
				</span>
			{/each}
		</div>
	</section>
{/if}
