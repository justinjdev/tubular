<script lang="ts">
	import { useThrelte } from '@threlte/core';

	interface Props {
		onReady?: (capture: () => string | null) => void;
	}

	let { onReady }: Props = $props();

	const { renderer } = useThrelte();

	function capture(): string | null {
		const r = renderer;
		if (!r || !('domElement' in r)) return null;
		const gl = r as import('three').WebGLRenderer;
		// Render one frame to ensure canvas is up to date
		return gl.domElement.toDataURL('image/png');
	}

	$effect(() => {
		onReady?.(capture);
	});
</script>
