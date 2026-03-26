<script lang="ts">
	import { T } from '@threlte/core';
	import { EdgesGeometry, BoxGeometry } from 'three';
	import { tableStore, type TabletopMaterial } from '$lib/stores/table.svelte';

	const cfg = $derived(tableStore.config);
	const top = $derived(cfg.tabletop);

	const materialColors: Record<TabletopMaterial, string> = {
		'none': '#000000',
		'steel-plate': '#8899AA',
		'diamond-plate': '#99AABB',
		'expanded-metal': '#778888',
		'wood-butcher-block': '#B08050',
		'plywood': '#C4A870',
		'mdf': '#A09080',
	};

	const color = $derived(materialColors[top.material]);
	const isExpanded = $derived(top.material === 'expanded-metal');
	const isMetal = $derived(
		top.material === 'steel-plate' || top.material === 'diamond-plate' || top.material === 'expanded-metal'
	);

	const topWidth = $derived(cfg.width + top.overhangLeft + top.overhangRight);
	const topDepth = $derived(cfg.depth + top.overhangFront + top.overhangBack);
	const topThickness = $derived(top.thickness);

	// Center offset: if overhangs are asymmetric, shift the top
	const xOffset = $derived((top.overhangRight - top.overhangLeft) / 2);
	const zOffset = $derived((top.overhangFront - top.overhangBack) / 2);

	// Y position: top of frame + half of tabletop thickness
	const legHeight = $derived(cfg.height - cfg.frameTube.height);
	const frameTopY = $derived(cfg.feet.height + legHeight + cfg.frameTube.height);
	const topY = $derived(frameTopY + topThickness / 2);

	const size = $derived([topWidth, topThickness, topDepth] as [number, number, number]);
	const position = $derived([xOffset, topY, zOffset] as [number, number, number]);
	const sizeKey = $derived(`top-${size.join(',')}`);
</script>

{#if top.material !== 'none'}
	<T.Mesh {position}>
		<T.BoxGeometry args={size} />
		{#if isExpanded}
			<T.MeshStandardMaterial
				{color}
				metalness={isMetal ? 0.5 : 0.1}
				roughness={isMetal ? 0.5 : 0.7}
				transparent={true}
				opacity={0.7}
			/>
		{:else}
			<T.MeshStandardMaterial
				{color}
				metalness={isMetal ? 0.5 : 0.1}
				roughness={isMetal ? 0.5 : 0.7}
			/>
		{/if}
	</T.Mesh>
	{#key sizeKey}
		{@const edges = new EdgesGeometry(new BoxGeometry(...size))}
		<T.LineSegments geometry={edges} position={position}>
			<T.LineBasicMaterial color="#3a3a3a" />
		</T.LineSegments>
	{/key}
{/if}
