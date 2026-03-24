<script lang="ts">
	import TableScene from '$lib/components/scene/TableScene.svelte';
	import DimensionControls from '$lib/components/controls/DimensionControls.svelte';
	import TubingControls from '$lib/components/controls/TubingControls.svelte';
	import BracingControls from '$lib/components/controls/BracingControls.svelte';
	import CutList from '$lib/components/output/CutList.svelte';
	import MaterialsSummary from '$lib/components/output/MaterialsSummary.svelte';
	import ExportButtons from '$lib/components/output/ExportButtons.svelte';
</script>

<div class="flex h-screen w-screen bg-neutral-900 text-white">
	<aside class="flex min-w-[320px] basis-[35%] flex-col gap-6 overflow-y-auto p-6">
		<h1 class="text-lg font-bold tracking-tight">Tubular</h1>

		<DimensionControls />
		<TubingControls />
		<BracingControls />

		<hr class="border-neutral-700" />

		<CutList />
		<MaterialsSummary />
		<ExportButtons />
	</aside>

	<main class="flex-1">
		<TableScene />
	</main>
</div>
