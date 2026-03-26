<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import { computeAssemblySequence, type AssemblyStep } from '$lib/utils/assembly-sequence';

	const config = $derived(tableStore.config);
	const steps = $derived(computeAssemblySequence(config));

	const phaseColors: Record<AssemblyStep['phase'], string> = {
		Cut: 'bg-blue-900/40 text-blue-300',
		Prep: 'bg-purple-900/40 text-purple-300',
		Tack: 'bg-amber-900/40 text-amber-300',
		Weld: 'bg-red-900/40 text-red-300',
		Finish: 'bg-green-900/40 text-green-300',
	};

	const lineDotColors: Record<AssemblyStep['phase'], string> = {
		Cut: 'bg-blue-400',
		Prep: 'bg-purple-400',
		Tack: 'bg-amber-400',
		Weld: 'bg-red-400',
		Finish: 'bg-green-400',
	};
</script>

<section class="flex flex-col gap-3">
	<h3 class="text-sm font-semibold uppercase tracking-wider text-neutral-400">Assembly Sequence</h3>

	<div class="rounded-lg bg-neutral-800 p-3">
		<div class="flex flex-col">
			{#each steps as s, i}
				<div class="flex gap-3 {i < steps.length - 1 ? 'pb-3' : ''}">
					<!-- Timeline column -->
					<div class="flex flex-col items-center">
						<div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full {lineDotColors[s.phase]}">
							<span class="text-[9px] font-bold text-neutral-950">{s.step}</span>
						</div>
						{#if i < steps.length - 1}
							<div class="w-px flex-1 bg-neutral-700"></div>
						{/if}
					</div>

					<!-- Content -->
					<div class="flex-1 pb-1">
						<div class="flex items-center gap-2">
							<span class="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider {phaseColors[s.phase]}">{s.phase}</span>
							<span class="text-xs font-medium text-neutral-200">{s.title}</span>
						</div>
						<p class="mt-0.5 text-[11px] leading-relaxed text-neutral-400">{s.details}</p>
						{#if s.tip}
							<p class="mt-0.5 text-[10px] italic text-neutral-500">{s.tip}</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
