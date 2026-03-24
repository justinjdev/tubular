<script lang="ts">
	import { T } from '@threlte/core';
	import { EdgesGeometry, BoxGeometry } from 'three';

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

	// Key on stringified size so geometry only rebuilds when dimensions change
	const sizeKey = $derived(size.join(','));
</script>

<T.Group {position} {rotation}>
	<T.Mesh>
		<T.BoxGeometry args={size} />
		<T.MeshStandardMaterial {color} metalness={0.5} roughness={0.5} />
	</T.Mesh>
	{#key sizeKey}
		{@const edges = new EdgesGeometry(new BoxGeometry(...size))}
		<T.LineSegments geometry={edges}>
			<T.LineBasicMaterial color="#3a3a3a" />
		</T.LineSegments>
	{/key}
</T.Group>
