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
	const halfLength = $derived(cfg.length / 2);
	const halfWidth = $derived(cfg.width / 2);

	// Length label: front edge midpoint, below table
	const lengthPos = $derived([0, -2, halfWidth + 4] as [number, number, number]);
	// Width label: right edge midpoint, below table
	const widthPos = $derived([halfLength + 4, -2, 0] as [number, number, number]);
	// Height label: right-front leg, beside it
	const heightPos = $derived([halfLength + 4, cfg.height / 2, halfWidth + 4] as [number, number, number]);
</script>

<HTML position={lengthPos} center pointerEvents="none">
	<div class="dim-label">L: {fmt(cfg.length)}</div>
</HTML>

<HTML position={widthPos} center pointerEvents="none">
	<div class="dim-label">W: {fmt(cfg.width)}</div>
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
