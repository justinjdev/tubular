<script lang="ts">
	import { T } from '@threlte/core';
	import { EdgesGeometry, BoxGeometry, CylinderGeometry } from 'three';
	import type { StockType } from '$lib/data/tubing-presets';

	interface Props {
		size: [number, number, number];
		position?: [number, number, number];
		rotation?: [number, number, number];
		color?: string;
		stockType?: StockType;
	}

	let {
		size,
		position = [0, 0, 0],
		rotation = [0, 0, 0],
		color = '#9aA8b8',
		stockType = 'tube'
	}: Props = $props();

	const isRound = $derived(stockType === 'round');

	// Key on stringified size + type so geometry only rebuilds when dimensions change
	const sizeKey = $derived(`${stockType}-${size.join(',')}`);
</script>

<T.Group {position} {rotation}>
	{#if isRound}
		{@const radius = size[0] / 2}
		{@const height = size[1]}
		<T.Mesh>
			<T.CylinderGeometry args={[radius, radius, height, 24]} />
			<T.MeshStandardMaterial {color} metalness={0.5} roughness={0.5} />
		</T.Mesh>
		{#key sizeKey}
			{@const edges = new EdgesGeometry(new CylinderGeometry(radius, radius, height, 24), 15)}
			<T.LineSegments geometry={edges}>
				<T.LineBasicMaterial color="#3a3a3a" />
			</T.LineSegments>
		{/key}
	{:else}
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
	{/if}
</T.Group>
