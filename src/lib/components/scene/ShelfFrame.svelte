<script lang="ts">
	import { tableStore, resolvedLegDimensions } from '$lib/stores/table.svelte';
	import TubeMember from './TubeMember.svelte';

	const cfg = $derived(tableStore.config);
	const legDims = $derived(resolvedLegDimensions(cfg));
	const isFlat = $derived(cfg.braceTube.stockType === 'flat-bar');
	const bVertical = $derived(isFlat ? cfg.braceTube.width : cfg.braceTube.height);
	const bDepth = $derived(isFlat ? cfg.braceTube.height : cfg.braceTube.width);
	const legW = $derived(legDims.legW);
	const legH = $derived(legDims.legH);
	const shelfY = $derived(cfg.feet.height + cfg.braceBottom + cfg.braceSpan);

	const halfWidth = $derived(cfg.width / 2 - legW / 2);
	const halfDepth = $derived(cfg.depth / 2 - legH / 2);

	// Long rails span full distance between legs minus tube width for fitment
	const longSpan = $derived(cfg.width - legW * 2);
	const shortSpan = $derived(cfg.depth - legH * 2);
</script>

<!-- Long rails (X-axis), front and back -->
<TubeMember size={[longSpan, bVertical, bDepth]} position={[0, shelfY, halfDepth]} color="#c08040" stockType={cfg.braceTube.stockType} />
<TubeMember size={[longSpan, bVertical, bDepth]} position={[0, shelfY, -halfDepth]} color="#c08040" stockType={cfg.braceTube.stockType} />

<!-- Short rails (Z-axis), left and right -->
<TubeMember size={[bDepth, bVertical, shortSpan]} position={[halfWidth, shelfY, 0]} color="#c08040" stockType={cfg.braceTube.stockType} />
<TubeMember size={[bDepth, bVertical, shortSpan]} position={[-halfWidth, shelfY, 0]} color="#c08040" stockType={cfg.braceTube.stockType} />
