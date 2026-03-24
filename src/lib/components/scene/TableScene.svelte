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

	<T.AmbientLight intensity={1.5} />
	<T.DirectionalLight position={[50, 80, 50]} intensity={2.5} />
	<T.DirectionalLight position={[-30, 40, -20]} intensity={1.0} />

	<Grid cellSize={1} sectionSize={12} infiniteGrid />

	<Legs />
	<TopFrame />
	<Bracing />
</Canvas>
