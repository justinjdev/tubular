<script lang="ts">
	import { T, Canvas } from '@threlte/core';
	import { OrbitControls, Grid } from '@threlte/extras';
	import { tableStore } from '$lib/stores/table.svelte';
	import Legs from './Legs.svelte';
	import TopFrame from './TopFrame.svelte';
	import Bracing from './Bracing.svelte';
	import CenterSupports from './CenterSupports.svelte';
	import Gussets from './Gussets.svelte';
	import DimensionLabels from './DimensionLabels.svelte';
	import CanvasCapture from './CanvasCapture.svelte';

	interface Props {
		onCaptureReady?: (capture: () => string | null) => void;
	}

	let { onCaptureReady }: Props = $props();

	const cfg = $derived(tableStore.config);

	// Initial camera position — computed once so orbit controls aren't reset on every change
	const initCfg = tableStore.config;
	const initDist = Math.max(initCfg.length, initCfg.width, initCfg.height) * 1.8;
	const cameraPosition: [number, number, number] = [initDist * 0.7, initDist * 0.5, initDist * 0.7];
	const orbitTarget: [number, number, number] = [0, initCfg.height * 0.4, 0];
</script>

<Canvas>
	<T.PerspectiveCamera makeDefault position={cameraPosition} fov={50}>
		<OrbitControls target={orbitTarget} enableDamping />
	</T.PerspectiveCamera>

	<T.AmbientLight intensity={1.5} />
	<T.DirectionalLight position={[50, 80, 50]} intensity={2.5} />
	<T.DirectionalLight position={[-30, 40, -20]} intensity={1.0} />

	<Grid cellSize={6} sectionSize={12} infiniteGrid />

	<Legs />
	<TopFrame />
	<Bracing />
	<CenterSupports />
	<Gussets />
	<DimensionLabels />
	<CanvasCapture onReady={onCaptureReady} />
</Canvas>
