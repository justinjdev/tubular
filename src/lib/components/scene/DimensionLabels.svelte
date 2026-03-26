<script lang="ts">
	import { HTML } from '@threlte/extras';
	import { tableStore } from '$lib/stores/table.svelte';

	const cfg = $derived(tableStore.config);

	const isMetric = $derived(cfg.metric);
	const unit = $derived(isMetric ? 'cm' : 'in');
	const factor = $derived(isMetric ? 2.54 : 1);

	const fmt = (v: number) => {
		const converted = v * factor;
		return `${converted % 1 === 0 ? converted : converted.toFixed(1)}${unit}`;
	};

	// Position labels below the table, offset from edges
	const halfWidth = $derived(cfg.width / 2);
	const halfDepth = $derived(cfg.depth / 2);

	// Width label: front edge midpoint, below table
	const widthPos = $derived([0, -2, halfDepth + 4] as [number, number, number]);
	// Depth label: right edge midpoint, below table
	const depthPos = $derived([halfWidth + 4, -2, 0] as [number, number, number]);
	// Height label: right-front leg, beside it
	const heightPos = $derived([halfWidth + 4, cfg.feet.height + cfg.height / 2, halfDepth + 4] as [number, number, number]);
</script>

<HTML position={widthPos} center pointerEvents="none">
	<div class="dim-label">W: {fmt(cfg.width)}</div>
</HTML>

<HTML position={depthPos} center pointerEvents="none">
	<div class="dim-label">D: {fmt(cfg.depth)}</div>
</HTML>

<HTML position={heightPos} center pointerEvents="none">
	<div class="dim-label">H: {fmt(cfg.height)}</div>
</HTML>

<style>
	.dim-label {
		color: white;
		font-size: 12px;
		font-family: 'SF Mono', 'Fira Code', monospace;
		background: rgba(0, 0, 0, 0.6);
		padding: 2px 8px;
		border-radius: 10px;
		white-space: nowrap;
		pointer-events: none;
		user-select: none;
	}
</style>
