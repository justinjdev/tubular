<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import TableScene from '$lib/components/scene/TableScene.svelte';
	import DimensionControls from '$lib/components/controls/DimensionControls.svelte';
	import TubingControls from '$lib/components/controls/TubingControls.svelte';
	import BracingControls from '$lib/components/controls/BracingControls.svelte';
	import StructureControls from '$lib/components/controls/StructureControls.svelte';
	import CutList from '$lib/components/output/CutList.svelte';
	import MaterialsSummary from '$lib/components/output/MaterialsSummary.svelte';
	import StockNesting from '$lib/components/output/StockNesting.svelte';
	import ExportButtons from '$lib/components/output/ExportButtons.svelte';

	const config = $derived(tableStore.config);

	type Tab = 'design' | 'fabrication';
	let activeTab = $state<Tab>('design');
	let captureScene: (() => string | null) | undefined = $state();
</script>

<div class="flex h-screen w-screen bg-neutral-900 text-white">
	<aside class="flex w-[380px] shrink-0 flex-col overflow-y-auto">
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
			<h1 class="text-lg font-bold tracking-tight">Tubular</h1>
			<div class="flex items-center gap-2">
				<button
					class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors {config.metric
						? 'bg-amber-500/20 text-amber-400'
						: 'bg-neutral-800 text-neutral-400 hover:text-neutral-300'}"
					onclick={() => tableStore.toggleMetric()}
				>
					<span class={config.metric ? 'opacity-50' : 'opacity-100'}>in</span>
					<span class="text-neutral-600">/</span>
					<span class={config.metric ? 'opacity-100' : 'opacity-50'}>mm</span>
				</button>
				<button
					class="rounded-full bg-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-300"
					onclick={() => tableStore.reset()}
				>
					Reset
				</button>
			</div>
		</div>

		<!-- Tabs -->
		<div class="flex border-b border-neutral-800">
			<button
				class="flex-1 py-2.5 text-sm font-medium transition-colors {activeTab === 'design'
					? 'border-b-2 border-amber-500 text-amber-500'
					: 'text-neutral-500 hover:text-neutral-300'}"
				onclick={() => (activeTab = 'design')}
			>
				Design
			</button>
			<button
				class="flex-1 py-2.5 text-sm font-medium transition-colors {activeTab === 'fabrication'
					? 'border-b-2 border-amber-500 text-amber-500'
					: 'text-neutral-500 hover:text-neutral-300'}"
				onclick={() => (activeTab = 'fabrication')}
			>
				Fabrication
			</button>
		</div>

		<!-- Tab content -->
		<div class="flex flex-col gap-6 p-6">
			{#if activeTab === 'design'}
				<DimensionControls />
				<TubingControls />
				<BracingControls />
				<StructureControls />
			{:else}
				<CutList />
				<MaterialsSummary />
				<StockNesting />
				<ExportButtons {captureScene} />
			{/if}
		</div>
	</aside>

	<main class="flex-1">
		<TableScene onCaptureReady={(fn) => (captureScene = fn)} />
	</main>
</div>
