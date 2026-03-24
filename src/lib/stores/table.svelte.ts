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
	braceHeight: number;
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
	braceHeight: 8,
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
			if (key === 'height' && config.braceHeight >= clamped) {
				config = { ...config, braceHeight: clamped - 1 };
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

		updateBraceHeight(value: number) {
			const clamped = Math.max(1, Math.min(config.height - 1, value));
			config = { ...config, braceHeight: clamped };
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
