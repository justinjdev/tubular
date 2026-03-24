<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import TableScene from '$lib/components/scene/TableScene.svelte';
	import AccordionSection from '$lib/components/controls/AccordionSection.svelte';
	import DimensionControls from '$lib/components/controls/DimensionControls.svelte';
	import TubingControls from '$lib/components/controls/TubingControls.svelte';
	import BracingControls from '$lib/components/controls/BracingControls.svelte';
	import StructureControls from '$lib/components/controls/StructureControls.svelte';
	import DrawerControls from '$lib/components/controls/DrawerControls.svelte';
	import CutList from '$lib/components/output/CutList.svelte';
	import DrawerList from '$lib/components/output/DrawerList.svelte';
	import MaterialsSummary from '$lib/components/output/MaterialsSummary.svelte';
	import StockNesting from '$lib/components/output/StockNesting.svelte';
	import ExportButtons from '$lib/components/output/ExportButtons.svelte';
	import { toFraction } from '$lib/utils/fractions';

	const config = $derived(tableStore.config);

	type Tab = 'design' | 'fabrication';
	let activeTab = $state<Tab>('design');
	let captureScene: (() => string | null) | undefined = $state();

	// Accordion state — only one section open at a time
	type Section = 'dims' | 'materials' | 'bracing' | 'structure' | 'drawers';
	let openSection = $state<Section>('dims');

	function toggle(s: Section) {
		openSection = openSection === s ? 'dims' : s;
	}

	// Summaries for collapsed sections
	const dimSummary = $derived(`${config.length} × ${config.width} × ${config.height}"`);
	const matSummary = $derived(
		`${config.legTube.width}×${config.legTube.height} legs, ${config.frameTube.width}×${config.frameTube.height} frame`
	);
	const braceSummary = $derived.by(() => {
		const sides = (['front', 'back', 'left', 'right'] as const)
			.filter((s) => config.bracing[s] !== 'none')
			.map((s) => `${s[0].toUpperCase()}:${config.bracing[s] === 'h-brace' ? 'H' : 'X'}`);
		return sides.length ? sides.join(' ') : 'none';
	});
	const structSummary = $derived.by(() => {
		const parts: string[] = [];
		if (config.shelfFrame) parts.push('shelf');
		const gussetCount = Object.values(config.gussets).filter(Boolean).length;
		if (gussetCount) parts.push(`${gussetCount}-side gussets`);
		if (config.centerSupports) parts.push(`${config.centerSupports} center`);
		return parts.join(', ') || 'none';
	});
	const drawerSummary = $derived.by(() => {
		const total = config.drawers.reduce((sum, b) => sum + (b?.drawers?.length ?? 0), 0);
		return total ? `${total} drawer${total > 1 ? 's' : ''}` : 'none';
	});
</script>

<div class="flex h-screen w-screen bg-neutral-950 text-white">
	<aside class="flex w-[380px] shrink-0 flex-col overflow-hidden bg-neutral-900">
		<!-- Header -->
		<div class="flex items-center justify-between px-5 py-3">
			<h1 class="text-sm font-bold uppercase tracking-[0.2em] text-neutral-300">Tubular</h1>
			<div class="flex items-center gap-1.5">
				<button
					class="rounded px-2 py-0.5 text-[10px] font-medium tracking-wide transition-colors {config.metric
						? 'bg-amber-500/15 text-amber-400'
						: 'text-neutral-500 hover:text-neutral-300'}"
					onclick={() => tableStore.toggleMetric()}
				>
					{config.metric ? 'MM' : 'IN'}
				</button>
				<button
					class="rounded px-2 py-0.5 text-[10px] font-medium text-neutral-600 transition-colors hover:text-neutral-400"
					onclick={() => tableStore.reset()}
				>
					Reset
				</button>
			</div>
		</div>

		<!-- Tabs -->
		<div class="flex border-b border-neutral-800">
			<button
				class="flex-1 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors {activeTab === 'design'
					? 'border-b border-amber-500 text-amber-500'
					: 'text-neutral-600 hover:text-neutral-400'}"
				onclick={() => (activeTab = 'design')}
			>
				Design
			</button>
			<button
				class="flex-1 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors {activeTab === 'fabrication'
					? 'border-b border-amber-500 text-amber-500'
					: 'text-neutral-600 hover:text-neutral-400'}"
				onclick={() => (activeTab = 'fabrication')}
			>
				Fabrication
			</button>
		</div>

		<!-- Scrollable content -->
		<div class="flex-1 overflow-y-auto">
			{#if activeTab === 'design'}
				<AccordionSection
					title="Dimensions"
					summary={dimSummary}
					open={openSection === 'dims'}
					onToggle={() => toggle('dims')}
				>
					<DimensionControls />
				</AccordionSection>

				<AccordionSection
					title="Materials"
					summary={matSummary}
					open={openSection === 'materials'}
					onToggle={() => toggle('materials')}
				>
					<TubingControls />
				</AccordionSection>

				<AccordionSection
					title="Bracing"
					summary={braceSummary}
					open={openSection === 'bracing'}
					onToggle={() => toggle('bracing')}
				>
					<BracingControls />
				</AccordionSection>

				<AccordionSection
					title="Structure"
					summary={structSummary}
					open={openSection === 'structure'}
					onToggle={() => toggle('structure')}
				>
					<StructureControls />
				</AccordionSection>

				<AccordionSection
					title="Drawers"
					summary={drawerSummary}
					open={openSection === 'drawers'}
					onToggle={() => toggle('drawers')}
				>
					<DrawerControls />
				</AccordionSection>
			{:else}
				<div class="flex flex-col gap-5 p-5">
					<CutList />
					<DrawerList />
					<MaterialsSummary />
					<StockNesting />
					<ExportButtons {captureScene} />
				</div>
			{/if}
		</div>
	</aside>

	<main class="flex-1 bg-neutral-950">
		<TableScene onCaptureReady={(fn) => (captureScene = fn)} />
	</main>
</div>
