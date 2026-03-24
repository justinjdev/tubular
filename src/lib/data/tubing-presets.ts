export interface TubePreset {
	label: string;
	width: number;
	height: number;
	thickness: number;
	gauge: number;
}

export const GAUGE_TO_THICKNESS: Record<number, number> = {
	16: 0.065,
	14: 0.075,
	13: 0.09,
	12: 0.105,
	11: 0.12,
	10: 0.135
};

export const TUBING_PRESETS: TubePreset[] = [
	{ label: '1" × 1" — 16ga', width: 1.0, height: 1.0, thickness: 0.065, gauge: 16 },
	{ label: '1" × 1" — 14ga', width: 1.0, height: 1.0, thickness: 0.075, gauge: 14 },
	{ label: '1" × 2" — 14ga', width: 1.0, height: 2.0, thickness: 0.075, gauge: 14 },
	{ label: '1" × 2" — 11ga', width: 1.0, height: 2.0, thickness: 0.12, gauge: 11 },
	{ label: '1.5" × 1.5" — 14ga', width: 1.5, height: 1.5, thickness: 0.075, gauge: 14 },
	{ label: '1.5" × 1.5" — 11ga', width: 1.5, height: 1.5, thickness: 0.12, gauge: 11 },
	{ label: '2" × 2" — 14ga', width: 2.0, height: 2.0, thickness: 0.075, gauge: 14 },
	{ label: '2" × 2" — 11ga', width: 2.0, height: 2.0, thickness: 0.12, gauge: 11 },
	{ label: '2" × 3" — 14ga', width: 2.0, height: 3.0, thickness: 0.075, gauge: 14 },
	{ label: '2" × 3" — 11ga', width: 2.0, height: 3.0, thickness: 0.12, gauge: 11 },
	{ label: '3" × 3" — 11ga', width: 3.0, height: 3.0, thickness: 0.12, gauge: 11 }
];
