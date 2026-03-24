import type { StockType } from '$lib/data/tubing-presets';

export type BraceType = 'none' | 'h-brace' | 'x-brace';
export type Side = 'front' | 'back' | 'left' | 'right';

export interface TubeProfile {
	width: number;
	height: number;
	thickness: number;
	stockType: StockType;
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
	centerSupports: number;
	footAllowance: number;
	gussets: boolean;
	gussetSize: number; // leg length of the right triangle, in inches
	gussetThickness: number; // plate thickness in inches
	shelfFrame: boolean;
	metric: boolean;
}

const defaultTube = (w: number, h: number, t: number, stockType: StockType = 'tube'): TubeProfile => ({
	width: w,
	height: h,
	thickness: t,
	stockType
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
	centerSupports: 0,
	footAllowance: 0,
	gussets: false,
	gussetSize: 3,
	gussetThickness: 0.1875,
	shelfFrame: false,
	metric: false
};

const STORAGE_KEY = 'tubular-config';

function loadConfig(): TableConfig {
	if (typeof localStorage === 'undefined') return { ...DEFAULT_CONFIG };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULT_CONFIG };
		const saved = JSON.parse(raw);
		// Merge with defaults so new fields get default values
		return { ...DEFAULT_CONFIG, ...saved };
	} catch {
		return { ...DEFAULT_CONFIG };
	}
}

function saveConfig(cfg: TableConfig) {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
	} catch {
		// quota exceeded or private browsing — ignore
	}
}

function createTableStore() {
	let config = $state<TableConfig>(loadConfig());

	function set(updates: Partial<TableConfig>) {
		config = { ...config, ...updates };
		saveConfig(config);
	}

	return {
		get config() {
			return config;
		},

		updateDimension(key: 'length' | 'width' | 'height', value: number) {
			const clamped = Math.max(12, Math.min(120, value));
			set({ [key]: clamped });
			if (key === 'height') {
				const maxSpan = clamped - config.braceBottom - 1;
				if (config.braceSpan > maxSpan) {
					set({ braceSpan: Math.max(1, maxSpan) });
				}
			}
		},

		updateTube(member: 'legTube' | 'frameTube' | 'braceTube', tube: TubeProfile) {
			set({ [member]: tube });
		},

		updateBracing(side: Side, type: BraceType) {
			set({ bracing: { ...config.bracing, [side]: type } });
		},

		updateBraceBottom(value: number) {
			const maxBottom = config.height - config.braceSpan - 1;
			set({ braceBottom: Math.max(0, Math.min(maxBottom, value)) });
		},

		updateBraceSpan(value: number) {
			const maxSpan = config.height - config.braceBottom - 1;
			set({ braceSpan: Math.max(1, Math.min(maxSpan, value)) });
		},

		updateFootAllowance(value: number) {
			set({ footAllowance: Math.max(0, value) });
		},

		updateCenterSupports(value: number) {
			set({ centerSupports: Math.max(0, Math.round(value)) });
		},

		toggleGussets() {
			set({ gussets: !config.gussets });
		},

		updateGussetSize(value: number) {
			set({ gussetSize: Math.max(1, Math.min(12, value)) });
		},

		updateGussetThickness(value: number) {
			set({ gussetThickness: Math.max(0.125, value) });
		},

		toggleShelfFrame() {
			set({ shelfFrame: !config.shelfFrame });
		},

		toggleMetric() {
			set({ metric: !config.metric });
		},

		reset() {
			config = { ...DEFAULT_CONFIG };
			saveConfig(config);
		}
	};
}

export const tableStore = createTableStore();
