<script lang="ts">
	import { onMount } from 'svelte';
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

	// Import from ?config= query param on load
	let importBanner = $state<string | null>(null);
	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const encoded = params.get('config');
		if (encoded) {
			const ok = tableStore.importBase64(encoded);
			importBanner = ok ? 'Design imported successfully' : 'Failed to import design from URL';
			// Clean URL without reload
			const url = new URL(window.location.href);
			url.searchParams.delete('config');
			window.history.replaceState({}, '', url.toString());
			if (ok) setTimeout(() => (importBanner = null), 3000);
		}
	});

	// Share/import modal
	let showShareModal = $state(false);
	let importText = $state('');
	let importError = $state<string | null>(null);

	function copyShareLink() {
		const base = window.location.origin + window.location.pathname;
		const url = `${base}?config=${tableStore.exportBase64()}`;
		navigator.clipboard.writeText(url);
		importBanner = 'Share link copied to clipboard';
		setTimeout(() => (importBanner = null), 2000);
		showShareModal = false;
	}

	function copyJSON() {
		navigator.clipboard.writeText(tableStore.exportJSON());
		importBanner = 'JSON copied to clipboard';
		setTimeout(() => (importBanner = null), 2000);
		showShareModal = false;
	}

	function handleImport() {
		importError = null;
		const text = importText.trim();
		if (!text) return;
		// Try JSON first, then base64
		let ok = tableStore.importJSON(text);
		if (!ok) ok = tableStore.importBase64(text);
		if (ok) {
			importBanner = 'Design imported successfully';
			setTimeout(() => (importBanner = null), 3000);
			showShareModal = false;
			importText = '';
		} else {
			importError = 'Invalid config — paste JSON or a base64 string';
		}
	}

	function handleFileUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const text = reader.result as string;
			const ok = tableStore.importJSON(text);
			if (ok) {
				importBanner = 'Design imported from file';
				setTimeout(() => (importBanner = null), 3000);
				showShareModal = false;
				importText = '';
			} else {
				importError = 'Invalid JSON file';
			}
		};
		reader.readAsText(file);
	}

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
					onclick={() => (showShareModal = !showShareModal)}
				>
					Share
				</button>
				<button
					class="rounded px-2 py-0.5 text-[10px] font-medium text-neutral-600 transition-colors hover:text-neutral-400"
					onclick={() => tableStore.reset()}
				>
					Reset
				</button>
			</div>
		</div>

		<!-- Import banner -->
		{#if importBanner}
			<div class="bg-amber-500/15 px-5 py-1.5 text-[11px] font-medium text-amber-400">
				{importBanner}
			</div>
		{/if}

		<!-- Share/Import modal -->
		{#if showShareModal}
			<div class="border-b border-neutral-800 bg-neutral-850 px-5 py-3">
				<div class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
					Export
				</div>
				<div class="flex gap-1.5">
					<button
						class="flex-1 rounded bg-amber-600 px-2 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-amber-500"
						onclick={copyShareLink}
					>
						Copy Share Link
					</button>
					<button
						class="flex-1 rounded bg-neutral-700 px-2 py-1.5 text-[11px] font-medium text-neutral-200 transition-colors hover:bg-neutral-600"
						onclick={copyJSON}
					>
						Copy JSON
					</button>
				</div>
				<div
					class="mb-2 mt-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-500"
				>
					Import
				</div>
				<textarea
					class="w-full rounded bg-neutral-800 px-2 py-1.5 font-mono text-[11px] text-neutral-300 placeholder-neutral-600 focus:ring-1 focus:ring-amber-500 focus:outline-none"
					rows="3"
					placeholder="Paste JSON config..."
					bind:value={importText}
				></textarea>
				{#if importError}
					<div class="mt-1 text-[11px] text-red-400">{importError}</div>
				{/if}
				<div class="mt-1.5 flex gap-1.5">
					<button
						class="flex-1 rounded bg-neutral-700 px-2 py-1.5 text-[11px] font-medium text-neutral-200 transition-colors hover:bg-neutral-600"
						onclick={handleImport}
					>
						Import
					</button>
					<label
						class="flex flex-1 cursor-pointer items-center justify-center rounded bg-neutral-700 px-2 py-1.5 text-[11px] font-medium text-neutral-200 transition-colors hover:bg-neutral-600"
					>
						Upload File
						<input type="file" accept=".json" class="hidden" onchange={handleFileUpload} />
					</label>
				</div>
			</div>
		{/if}

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
