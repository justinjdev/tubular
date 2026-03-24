<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeCutList } from '$lib/utils/cut-list';
	import { computeMaterials } from '$lib/utils/materials';
	import { exportPDF } from '$lib/utils/export-pdf';
	import { exportDXF } from '$lib/utils/export-dxf';

	interface Props {
		captureScene?: () => string | null;
	}

	let { captureScene }: Props = $props();

	const config = $derived(tableStore.config);
	const items = $derived(computeCutList(config));
	const materials = $derived(computeMaterials(items));

	function handlePDF() {
		const sceneImage = captureScene?.() ?? null;
		exportPDF(config, items, materials, sceneImage);
	}

	function handleDXF() {
		exportDXF(config);
	}
</script>

<section class="flex gap-3">
	<button
		class="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-500 active:bg-amber-700"
		onclick={handlePDF}
	>
		Export PDF
	</button>
	<button
		class="flex-1 rounded-lg bg-neutral-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-600 active:bg-neutral-800"
		onclick={handleDXF}
	>
		Export DXF
	</button>
</section>
