<script lang="ts">
	import { T, Canvas } from '@threlte/core';
	import { OrbitControls, Grid } from '@threlte/extras';
	import Legs from './Legs.svelte';
	import TopFrame from './TopFrame.svelte';
	import Bracing from './Bracing.svelte';
</script>

<Canvas>
	<T.PerspectiveCamera makeDefault position={[80, 60, 80]} fov={50}>
		<OrbitControls target={[0, 15, 0]} enableDamping />
	</T.PerspectiveCamera>

	<T.AmbientLight intensity={0.6} />
	<T.DirectionalLight position={[50, 80, 50]} intensity={1.0} castShadow />

	<Grid cellSize={1} sectionSize={12} infiniteGrid />

	<Legs />
	<TopFrame />
	<Bracing />
</Canvas>
