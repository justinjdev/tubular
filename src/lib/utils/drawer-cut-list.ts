import type { TableConfig, DrawerConfig } from '$lib/stores/table.svelte';

export interface DrawerDimensions {
	bayIndex: number;
	drawerIndex: number;
	boxWidth: number; // interior opening minus slide gaps
	boxDepth: number; // table depth minus insets
	boxHeight: number; // as specified
	slideLength: number; // closest standard slide length
}

export interface DrawerPanel {
	description: string;
	material: string;
	width: number;
	height: number;
	quantity: number;
	note?: string;
}

export interface DrawerHardware {
	description: string;
	spec: string;
	quantity: number;
}

export interface DrawerBayInfo {
	bayIndex: number;
	bayWidth: number; // opening width between legs/supports
	bayStartX: number; // X offset from table center
}

export interface DrawerCutList {
	panels: DrawerPanel[];
	hardware: DrawerHardware[];
	slideRails: { length: number; quantity: number; material: string; mountType: string };
	dimensions: DrawerDimensions[];
	bays: DrawerBayInfo[];
}

/** Standard ball-bearing slide lengths */
const SLIDE_LENGTHS = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28];

function nearestSlideLength(depth: number): number {
	// Pick the largest slide that fits
	let best = SLIDE_LENGTHS[0];
	for (const sl of SLIDE_LENGTHS) {
		if (sl <= depth) best = sl;
	}
	return best;
}

/**
 * Compute bay positions. Bays are spaces between legs and center supports.
 * Returns the width and X-center of each bay.
 */
export function computeBays(config: TableConfig): DrawerBayInfo[] {
	const legW = config.legTube.width;
	const innerWidth = config.width - legW * 2; // space between legs along X
	const numBays = config.centerSupports + 1;
	const bayWidth = innerWidth / numBays;
	const startX = -config.width / 2 + legW; // left inner edge

	const bays: DrawerBayInfo[] = [];
	for (let i = 0; i < numBays; i++) {
		bays.push({
			bayIndex: i,
			bayWidth,
			bayStartX: startX + bayWidth * i + bayWidth / 2 // center X of bay
		});
	}
	return bays;
}

export function computeDrawerCutList(config: TableConfig): DrawerCutList {
	const panels: DrawerPanel[] = [];
	const hardware: DrawerHardware[] = [];
	const dimensions: DrawerDimensions[] = [];
	const bays = computeBays(config);

	const legW = config.legTube.width;
	const legH = config.legTube.height;
	const innerWidth = config.width - legW * 2;
	const numBays = config.centerSupports + 1;
	const bayWidth = innerWidth / numBays;

	const sideT = config.drawerSideThickness;
	const bottomT = config.drawerBottomThickness;

	// Drawer box dimensions
	const boxWidth = bayWidth - config.drawerSlideGap * 2;
	const boxDepth = config.drawerDepth;
	const slideLen = nearestSlideLength(boxDepth);

	let totalDrawers = 0;
	let totalSlideRails = 0;

	for (let bayIdx = 0; bayIdx < numBays; bayIdx++) {
		const bayDrawers = config.drawers[bayIdx]?.drawers ?? [];

		for (let di = 0; di < bayDrawers.length; di++) {
			const d = bayDrawers[di];
			totalDrawers++;

			dimensions.push({
				bayIndex: bayIdx,
				drawerIndex: di,
				boxWidth,
				boxDepth,
				boxHeight: d.height,
				slideLength: slideLen
			});
		}

		// Each drawer needs 2 slide mounting rails (one per side)
		if (bayDrawers.length > 0) {
			totalSlideRails += 2; // 2 rails per bay (left and right)
		}
	}

	if (totalDrawers === 0) {
		return { panels, hardware, slideRails: { length: 0, quantity: 0, material: '', mountType: '' }, dimensions, bays };
	}

	// Group drawers by height for panel cut list
	const heightGroups = new Map<number, number>();
	for (const dim of dimensions) {
		heightGroups.set(dim.boxHeight, (heightGroups.get(dim.boxHeight) ?? 0) + 1);
	}

	// Standard drawer box joinery:
	// - Sides: full depth, rabbet on front/back ends (rabbet depth = sideT, width = sideT)
	// - Front/Back: width = boxWidth - 2×sideT (fits inside side rabbets)
	// - Bottom: sits in dado grooves routed into all 4 sides, 1/4" up from bottom
	//   Bottom size = boxWidth - 2×(sideT - bottomT/2) for snug dado fit
	//   Simplified: bottom = (boxWidth - sideT) × (boxDepth - sideT) to sit in dadoes
	const dadoInset = sideT - bottomT / 2; // dado centered on side thickness

	for (const [h, count] of heightGroups) {
		panels.push({
			description: `Drawer Side (${h}" tall)`,
			material: `${sideT}" stock`,
			width: boxDepth,
			height: h,
			quantity: count * 2,
			note: `Rabbet both ends ${sideT}" wide × ${sideT}" deep; dado for bottom ${bottomT}" wide, ${bottomT / 2}" deep, 1/4" up`
		});
		panels.push({
			description: `Drawer Front/Back (${h}" tall)`,
			material: `${sideT}" stock`,
			width: boxWidth - sideT * 2,
			height: h,
			quantity: count * 2,
			note: `Fits in side rabbets; dado for bottom ${bottomT}" wide, ${bottomT / 2}" deep, 1/4" up`
		});
		panels.push({
			description: `Drawer Bottom`,
			material: `${bottomT}" stock`,
			width: boxWidth - sideT * 2 + bottomT,
			height: boxDepth - sideT * 2 + bottomT,
			quantity: count,
			note: 'Sits in dado grooves on all 4 sides'
		});
	}

	// Hardware: slides (2 per drawer)
	hardware.push({
		description: 'Ball Bearing Drawer Slide',
		spec: `${slideLen}" full extension`,
		quantity: totalDrawers * 2
	});

	// Slide mounting rail length = leg height below frame
	const railLength = config.height - config.frameTube.height - config.footAllowance;

	return {
		panels,
		hardware,
		slideRails: {
			length: railLength,
			quantity: totalSlideRails,
			material: config.drawerSlideMountSize,
			mountType: config.drawerSlideMount
		},
		dimensions,
		bays
	};
}
