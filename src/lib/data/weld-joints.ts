export interface JointInfo {
	type: string;
	name: string;
	description: string;
	cutLengthAdjust: string;
	symbol: string;
}

export const WELD_JOINTS: JointInfo[] = [
	{
		type: 'butt',
		name: 'Butt Joint',
		description: 'Square-cut ends butted together. Simplest joint.',
		cutLengthAdjust: 'No adjustment — nominal length',
		symbol: '⊥'
	},
	{
		type: 'cope',
		name: 'Coped / Notched',
		description: 'End profiled to wrap around the mating tube. Stronger joint, more prep.',
		cutLengthAdjust: 'Add ~half the mating tube width to each coped end',
		symbol: '⌒'
	},
	{
		type: 'miter',
		name: 'Mitered',
		description: '45° angle cut at corners. Clean look, requires precise cuts.',
		cutLengthAdjust: 'Add tube width to each mitered end (45° extends the cut)',
		symbol: '∠'
	},
	{
		type: 'fish-mouth',
		name: 'Fish Mouth (Saddle)',
		description: 'Curved profile for round tube-to-tube joints. Requires notcher or plasma.',
		cutLengthAdjust: 'Add ~half the mating tube OD to each saddle end',
		symbol: '◠'
	}
];
