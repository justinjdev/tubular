<script lang="ts">
	import { T, Canvas } from '@threlte/core';
	import { OrbitControls, Grid } from '@threlte/extras';
	import { tableStore } from '$lib/stores/table.svelte';
	import Legs from './Legs.svelte';
	import TopFrame from './TopFrame.svelte';
	import Bracing from './Bracing.svelte';
	import CenterSupports from './CenterSupports.svelte';
	import DimensionLabels from './DimensionLabels.svelte';

	const cfg = $derived(tableStore.config);
	const distance = $derived(Math.max(cfg.length, cfg.width, cfg.height) * 1.8);
	const cameraPosition = $derived([distance * 0.7, distance * 0.5, distance * 0.7] as [number, number, number]);
	const orbitTarget = $derived([0, cfg.height * 0.4, 0] as [number, number, number]);
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
	<DimensionLabels />
</Canvas>
