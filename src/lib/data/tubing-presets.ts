export type StockType = 'tube' | 'flat-bar';

export interface StockPreset {
	label: string;
	type: StockType;
	width: number;
	height: number;
	thickness: number;
	gauge?: number;
}

export const GAUGE_TO_THICKNESS: Record<number, number> = {
	16: 0.065,
	14: 0.075,
	13: 0.09,
	12: 0.105,
	11: 0.12,
	10: 0.135
};

export const TUBE_PRESETS: StockPreset[] = [
	{ label: '1" × 1" — 16ga', type: 'tube', width: 1.0, height: 1.0, thickness: 0.065, gauge: 16 },
	{ label: '1" × 1" — 14ga', type: 'tube', width: 1.0, height: 1.0, thickness: 0.075, gauge: 14 },
	{ label: '1" × 2" — 14ga', type: 'tube', width: 1.0, height: 2.0, thickness: 0.075, gauge: 14 },
	{ label: '1" × 2" — 11ga', type: 'tube', width: 1.0, height: 2.0, thickness: 0.12, gauge: 11 },
	{ label: '1.5" × 1.5" — 14ga', type: 'tube', width: 1.5, height: 1.5, thickness: 0.075, gauge: 14 },
	{ label: '1.5" × 1.5" — 11ga', type: 'tube', width: 1.5, height: 1.5, thickness: 0.12, gauge: 11 },
	{ label: '2" × 2" — 14ga', type: 'tube', width: 2.0, height: 2.0, thickness: 0.075, gauge: 14 },
	{ label: '2" × 2" — 11ga', type: 'tube', width: 2.0, height: 2.0, thickness: 0.12, gauge: 11 },
	{ label: '2" × 3" — 14ga', type: 'tube', width: 2.0, height: 3.0, thickness: 0.075, gauge: 14 },
	{ label: '2" × 3" — 11ga', type: 'tube', width: 2.0, height: 3.0, thickness: 0.12, gauge: 11 },
	{ label: '3" × 3" — 11ga', type: 'tube', width: 3.0, height: 3.0, thickness: 0.12, gauge: 11 }
];

export const FLAT_BAR_PRESETS: StockPreset[] = [
	{ label: '1" × 1/8" flat', type: 'flat-bar', width: 1.0, height: 0.125, thickness: 0.125 },
	{ label: '1" × 3/16" flat', type: 'flat-bar', width: 1.0, height: 0.1875, thickness: 0.1875 },
	{ label: '1" × 1/4" flat', type: 'flat-bar', width: 1.0, height: 0.25, thickness: 0.25 },
	{ label: '1.5" × 1/8" flat', type: 'flat-bar', width: 1.5, height: 0.125, thickness: 0.125 },
	{ label: '1.5" × 3/16" flat', type: 'flat-bar', width: 1.5, height: 0.1875, thickness: 0.1875 },
	{ label: '1.5" × 1/4" flat', type: 'flat-bar', width: 1.5, height: 0.25, thickness: 0.25 },
	{ label: '2" × 1/8" flat', type: 'flat-bar', width: 2.0, height: 0.125, thickness: 0.125 },
	{ label: '2" × 3/16" flat', type: 'flat-bar', width: 2.0, height: 0.1875, thickness: 0.1875 },
	{ label: '2" × 1/4" flat', type: 'flat-bar', width: 2.0, height: 0.25, thickness: 0.25 },
	{ label: '3" × 1/4" flat', type: 'flat-bar', width: 3.0, height: 0.25, thickness: 0.25 },
];

export const ALL_PRESETS: StockPreset[] = [...TUBE_PRESETS, ...FLAT_BAR_PRESETS];
