<script lang="ts">
	import { tableStore, type WeldJoint, type WeldJointConfig } from '$lib/stores/table.svelte';
	import { WELD_JOINTS } from '$lib/data/weld-joints';

	const config = $derived(tableStore.config);
	const joints = $derived(config.weldJoints ?? { legToFrame: 'butt', braceToLeg: 'butt', frameCorners: 'butt' });

	// Fish-mouth only available when relevant tubes are round
	const legIsRound = $derived(config.legTube.stockType === 'round');
	const frameIsRound = $derived(config.frameTube.stockType === 'round');
	const braceIsRound = $derived(config.braceTube.stockType === 'round');

	interface ConnectionRow {
		key: keyof WeldJointConfig;
		label: string;
		allowFishMouth: boolean;
	}

	const connections: ConnectionRow[] = [
		{ key: 'legToFrame', label: 'Leg \u2192 Frame', get allowFishMouth() { return legIsRound && frameIsRound; } },
		{ key: 'braceToLeg', label: 'Brace \u2192 Leg', get allowFishMouth() { return braceIsRound && legIsRound; } },
		{ key: 'frameCorners', label: 'Frame Corners', get allowFishMouth() { return frameIsRound; } },
	];

	function availableJoints(allowFishMouth: boolean): typeof WELD_JOINTS {
		if (allowFishMouth) return WELD_JOINTS;
		return WELD_JOINTS.filter(j => j.type !== 'fish-mouth');
	}

	function jointInfo(type: string) {
		return WELD_JOINTS.find(j => j.type === type);
	}
</script>

<div class="flex flex-col gap-3">
	{#each connections as conn}
		{@const current = joints[conn.key]}
		{@const info = jointInfo(current)}
		{@const options = availableJoints(conn.allowFishMouth)}
		<div class="flex flex-col gap-1">
			<div class="flex items-center justify-between">
				<label class="text-xs text-neutral-500">{conn.label}</label>
				<select
					class="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300 focus:ring-1 focus:ring-amber-500 focus:outline-none"
					value={current}
					onchange={(e) => tableStore.updateWeldJoint(conn.key, (e.target as HTMLSelectElement).value as WeldJoint)}
				>
					{#each options as joint}
						<option value={joint.type}>{joint.symbol} {joint.name}</option>
					{/each}
				</select>
			</div>
			{#if info && current !== 'butt'}
				<p class="text-[10px] text-neutral-500">{info.description}</p>
			{/if}
		</div>
	{/each}
</div>
