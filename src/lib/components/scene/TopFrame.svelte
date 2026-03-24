<script lang="ts">
	import { tableStore } from '$lib/stores/table.svelte';
	import TubeMember from './TubeMember.svelte';

	const cfg = $derived(tableStore.config);
	const legHeight = $derived(cfg.height - cfg.frameTube.height);
	const frameY = $derived(legHeight + cfg.frameTube.height / 2);

	const legW = $derived(cfg.legTube.width);
	const legH = $derived(cfg.legTube.height);
	const fw = $derived(cfg.frameTube.width);
	const fh = $derived(cfg.frameTube.height);

	// Long rails run full table length along X
	const halfWidth = $derived(cfg.width / 2 - legH / 2);
	// Short rails shortened by legTube.width at each end (butt joints)
	const shortRailLength = $derived(cfg.width - legH * 2);
	const halfLength = $derived(cfg.length / 2 - legW / 2);
</script>

<!-- Long rails (X-axis), front and back -->
<TubeMember size={[cfg.length, fh, fw]} position={[0, frameY, halfWidth]} />
<TubeMember size={[cfg.length, fh, fw]} position={[0, frameY, -halfWidth]} />

<!-- Short rails (Z-axis), left and right, shortened for butt joints -->
<TubeMember size={[fw, fh, shortRailLength]} position={[halfLength, frameY, 0]} />
<TubeMember size={[fw, fh, shortRailLength]} position={[-halfLength, frameY, 0]} />
