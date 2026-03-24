<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import TubeMember from './TubeMember.svelte';

	const cfg = $derived(tableStore.config);
	const isFlat = $derived(cfg.braceTube.stockType === 'flat-bar');
	const bVertical = $derived(isFlat ? cfg.braceTube.width : cfg.braceTube.height);
	const bDepth = $derived(isFlat ? cfg.braceTube.height : cfg.braceTube.width);
	const legW = $derived(cfg.legTube.width);
	const legH = $derived(cfg.legTube.height);
	const shelfY = $derived(cfg.braceBottom + cfg.braceSpan);

	const halfLength = $derived(cfg.length / 2 - legW / 2);
	const halfWidth = $derived(cfg.width / 2 - legH / 2);

	// Long rails span full distance between legs minus tube width for fitment
	const longSpan = $derived(cfg.length - legW * 2);
	const shortSpan = $derived(cfg.width - legH * 2);
</script>

<!-- Long rails (X-axis), front and back -->
<TubeMember size={[longSpan, bVertical, bDepth]} position={[0, shelfY, halfWidth]} />
<TubeMember size={[longSpan, bVertical, bDepth]} position={[0, shelfY, -halfWidth]} />

<!-- Short rails (Z-axis), left and right -->
<TubeMember size={[bDepth, bVertical, shortSpan]} position={[halfLength, shelfY, 0]} />
<TubeMember size={[bDepth, bVertical, shortSpan]} position={[-halfLength, shelfY, 0]} />
