<script lang="ts">
	import { T } from '@threlte/core';

	interface Props {
		size: [number, number, number];
		position?: [number, number, number];
		rotation?: [number, number, number];
		color?: string;
	}

	let {
		size,
		position = [0, 0, 0],
		rotation = [0, 0, 0],
		color = '#9aA8b8'
	}: Props = $props();
</script>

<T.Mesh position={position} rotation={rotation}>
	<T.BoxGeometry args={size} />
	<T.MeshStandardMaterial color={color} metalness={0.5} roughness={0.5} />
</T.Mesh>
