export type BraceType = 'none' | 'h-brace' | 'x-brace';
export type Side = 'front' | 'back' | 'left' | 'right';

export interface TubeProfile {
	width: number;
	height: number;
	thickness: number;
}

export interface TableConfig {
	length: number;
	width: number;
	height: number;
	legTube: TubeProfile;
	frameTube: TubeProfile;
	braceTube: TubeProfile;
	bracing: Record<Side, BraceType>;
	braceBottom: number;
	braceSpan: number;
	shelfFrame: boolean;
	metric: boolean;
}

const defaultTube = (w: number, h: number, t: number): TubeProfile => ({
	width: w,
	height: h,
	thickness: t
});

export const DEFAULT_CONFIG: TableConfig = {
	length: 60,
	width: 30,
	height: 30,
	legTube: defaultTube(2, 2, 0.075),
	frameTube: defaultTube(2, 2, 0.075),
	braceTube: defaultTube(1, 1, 0.075),
	bracing: { front: 'none', back: 'none', left: 'none', right: 'none' },
	braceBottom: 0,
	braceSpan: 8,
	shelfFrame: false,
	metric: false
};

function createTableStore() {
	let config = $state<TableConfig>({ ...DEFAULT_CONFIG });

	return {
		get config() {
			return config;
		},
		set config(v: TableConfig) {
			config = v;
		},

		updateDimension(key: 'length' | 'width' | 'height', value: number) {
			const clamped = Math.max(12, Math.min(120, value));
			config = { ...config, [key]: clamped };
			if (key === 'height') {
				const maxSpan = clamped - config.braceBottom - 1;
				if (config.braceSpan > maxSpan) {
					config = { ...config, braceSpan: Math.max(1, maxSpan) };
				}
			}
		},

		updateTube(member: 'legTube' | 'frameTube' | 'braceTube', tube: TubeProfile) {
			config = { ...config, [member]: tube };
		},

		updateBracing(side: Side, type: BraceType) {
			config = {
				...config,
				bracing: { ...config.bracing, [side]: type }
			};
		},

		updateBraceBottom(value: number) {
			const maxBottom = config.height - config.braceSpan - 1;
			const clamped = Math.max(0, Math.min(maxBottom, value));
			config = { ...config, braceBottom: clamped };
		},

		updateBraceSpan(value: number) {
			const maxSpan = config.height - config.braceBottom - 1;
			const clamped = Math.max(1, Math.min(maxSpan, value));
			config = { ...config, braceSpan: clamped };
		},

		toggleShelfFrame() {
			config = { ...config, shelfFrame: !config.shelfFrame };
		},

		toggleMetric() {
			config = { ...config, metric: !config.metric };
		}
	};
}

export const tableStore = createTableStore();
