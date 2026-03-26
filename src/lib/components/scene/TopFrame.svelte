<script lang="ts">
	import { tableStore, resolvedLegDimensions } from '$lib/stores/table.svelte';
	import TubeMember from './TubeMember.svelte';

	const cfg = $derived(tableStore.config);
	const legDims = $derived(resolvedLegDimensions(cfg));
	const legHeight = $derived(cfg.height - cfg.frameTube.height);
	const frameY = $derived(cfg.feet.height + legHeight + cfg.frameTube.height / 2);

	const legW = $derived(legDims.legW);
	const legH = $derived(legDims.legH);
	const fw = $derived(cfg.frameTube.width);
	const fh = $derived(cfg.frameTube.height);

	// Long rails run full table width along X
	const halfDepth = $derived(cfg.depth / 2 - legH / 2);
	// Short rails shortened by legTube.width at each end (butt joints)
	const shortRailLen = $derived(cfg.depth - legH * 2);
	const halfWidth = $derived(cfg.width / 2 - legW / 2);
</script>

<!-- Long rails (X-axis), front and back -->
<TubeMember size={[cfg.width, fh, fw]} position={[0, frameY, halfDepth]} color="#a0b0c0" stockType={cfg.frameTube.stockType} />
<TubeMember size={[cfg.width, fh, fw]} position={[0, frameY, -halfDepth]} color="#a0b0c0" stockType={cfg.frameTube.stockType} />

<!-- Short rails (Z-axis), left and right, shortened for butt joints -->
<TubeMember size={[fw, fh, shortRailLen]} position={[halfWidth, frameY, 0]} color="#a0b0c0" stockType={cfg.frameTube.stockType} />
<TubeMember size={[fw, fh, shortRailLen]} position={[-halfWidth, frameY, 0]} color="#a0b0c0" stockType={cfg.frameTube.stockType} />
