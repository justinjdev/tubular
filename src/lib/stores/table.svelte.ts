import type { StockType } from '$lib/data/tubing-presets';

export type BraceType = 'none' | 'h-brace' | 'x-brace';
export type Side = 'front' | 'back' | 'left' | 'right';
export type Corner = 'front-left' | 'front-right' | 'back-left' | 'back-right';
export type GussetFace = 'front' | 'back' | 'left' | 'right';

export interface TubeProfile {
	width: number;
	height: number;
	thickness: number;
	stockType: StockType;
}

export interface DrawerConfig {
	height: number; // drawer box height in inches
}

export interface BayDrawers {
	drawers: DrawerConfig[];
}

export interface TableConfig {
	width: number;
	depth: number;
	height: number;
	legTube: TubeProfile;
	frameTube: TubeProfile;
	braceTube: TubeProfile;
	bracing: Record<Side, BraceType>;
	braceBottom: number;
	braceSpan: number;
	centerSupports: number;
	footAllowance: number;
	gussets: Record<GussetFace, boolean>;
	gussetSize: number; // leg length of the right triangle, in inches
	gussetThickness: number; // plate thickness in inches
	drawers: BayDrawers[]; // one entry per bay (bays = centerSupports + 1)
	drawerSlideGap: number; // clearance per side for slides (default 0.5")
	drawerDepth: number; // drawer box depth in inches
	drawerFrontInset: number; // how far back from the front leg face the drawer sits
	drawerSideThickness: number; // sides, front, back in inches
	drawerBottomThickness: number; // bottom panel in inches
	drawerSlideMount: 'angle-iron' | 'flat-bar' | 'hardwood'; // material for slide mounting rails
	drawerSlideMountSize: string; // e.g. "1×1×1/8" for angle, "1×1/8" for flat bar
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
	width: 60,
	depth: 30,
	height: 30,
	legTube: defaultTube(2, 2, 0.075),
	frameTube: defaultTube(2, 2, 0.075),
	braceTube: defaultTube(1, 1, 0.075),
	bracing: { front: 'none', back: 'none', left: 'none', right: 'none' },
	braceBottom: 0,
	braceSpan: 8,
	centerSupports: 0,
	footAllowance: 0,
	gussets: { front: false, back: false, left: false, right: false },
	gussetSize: 3,
	gussetThickness: 0.1875,
	drawers: [],
	drawerSlideGap: 0.5,
	drawerDepth: 18,
	drawerFrontInset: 1,
	drawerSideThickness: 0.5,
	drawerBottomThickness: 0.25,
	drawerSlideMount: 'angle-iron' as const,
	drawerSlideMountSize: '1×1×1/8',
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
		const merged = { ...DEFAULT_CONFIG, ...saved };
		// Migrate old length/width → width/depth
		if ('length' in saved && !('width' in saved)) {
			merged.width = saved.length;
		}
		if ('length' in saved && 'width' in saved && !('depth' in saved)) {
			merged.width = saved.length;
			merged.depth = saved.width;
		}
		// Migrate old gusset formats to per-face
		if (typeof merged.gussets === 'boolean') {
			const all = merged.gussets;
			merged.gussets = { front: all, back: all, left: all, right: all };
		} else if (merged.gussets && 'front-left' in merged.gussets) {
			// Migrate per-corner to per-face
			const g = merged.gussets as Record<string, boolean>;
			merged.gussets = {
				front: g['front-left'] || g['front-right'] || false,
				back: g['back-left'] || g['back-right'] || false,
				left: g['front-left'] || g['back-left'] || false,
				right: g['front-right'] || g['back-right'] || false,
			};
		}
		return merged;
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

		updateDimension(key: 'width' | 'depth' | 'height', value: number) {
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

		toggleGussetFace(face: GussetFace) {
			set({ gussets: { ...config.gussets, [face]: !config.gussets[face] } });
		},

		setAllGussets(enabled: boolean) {
			set({ gussets: { front: enabled, back: enabled, left: enabled, right: enabled } });
		},

		updateGussetSize(value: number) {
			set({ gussetSize: Math.max(1, Math.min(12, value)) });
		},

		updateGussetThickness(value: number) {
			set({ gussetThickness: Math.max(0.125, value) });
		},

		addDrawer(bayIndex: number, height: number = 4) {
			const drawers = [...config.drawers];
			while (drawers.length <= bayIndex) drawers.push({ drawers: [] });
			drawers[bayIndex] = {
				drawers: [...drawers[bayIndex].drawers, { height }]
			};
			set({ drawers });
		},

		removeDrawer(bayIndex: number, drawerIndex: number) {
			const drawers = [...config.drawers];
			if (!drawers[bayIndex]) return;
			const bayDrawers = [...drawers[bayIndex].drawers];
			bayDrawers.splice(drawerIndex, 1);
			drawers[bayIndex] = { drawers: bayDrawers };
			set({ drawers });
		},

		updateDrawerHeight(bayIndex: number, drawerIndex: number, height: number) {
			const drawers = [...config.drawers];
			if (!drawers[bayIndex]?.drawers[drawerIndex]) return;
			const bayDrawers = [...drawers[bayIndex].drawers];
			bayDrawers[drawerIndex] = { height: Math.max(2, Math.min(16, height)) };
			drawers[bayIndex] = { drawers: bayDrawers };
			set({ drawers });
		},

		updateDrawerSlideGap(value: number) {
			set({ drawerSlideGap: Math.max(0.25, Math.min(1, value)) });
		},

		updateDrawerDepth(value: number) {
			set({ drawerDepth: Math.max(6, Math.min(48, value)) });
		},

		updateDrawerFrontInset(value: number) {
			set({ drawerFrontInset: Math.max(0, Math.min(6, value)) });
		},

		updateDrawerSideThickness(value: number) {
			set({ drawerSideThickness: value });
		},

		updateDrawerBottomThickness(value: number) {
			set({ drawerBottomThickness: value });
		},

		updateDrawerSlideMount(mount: 'angle-iron' | 'flat-bar' | 'hardwood', size: string) {
			set({ drawerSlideMount: mount, drawerSlideMountSize: size });
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
		},

		exportJSON(): string {
			return JSON.stringify(config, null, 2);
		},

		exportBase64(): string {
			return btoa(JSON.stringify(config));
		},

		importJSON(json: string): boolean {
			try {
				const parsed = JSON.parse(json);
				if (typeof parsed !== 'object' || parsed === null) return false;
				const merged = { ...DEFAULT_CONFIG, ...parsed };
				// Migrate old length/width → width/depth
				if ('length' in parsed && !('width' in parsed)) {
					merged.width = parsed.length;
				}
				if ('length' in parsed && 'width' in parsed && !('depth' in parsed)) {
					merged.width = parsed.length;
					merged.depth = parsed.width;
				}
				// Migrate gusset formats
				if (typeof merged.gussets === 'boolean') {
					const all = merged.gussets;
					merged.gussets = { front: all, back: all, left: all, right: all };
				} else if (merged.gussets && 'front-left' in merged.gussets) {
					const g = merged.gussets as Record<string, boolean>;
					merged.gussets = {
						front: g['front-left'] || g['front-right'] || false,
						back: g['back-left'] || g['back-right'] || false,
						left: g['front-left'] || g['back-left'] || false,
						right: g['front-right'] || g['back-right'] || false,
					};
				}
				config = merged;
				saveConfig(config);
				return true;
			} catch {
				return false;
			}
		},

		importBase64(encoded: string): boolean {
			try {
				const json = atob(encoded);
				return this.importJSON(json);
			} catch {
				return false;
			}
		}
	};
}

export const tableStore = createTableStore();
