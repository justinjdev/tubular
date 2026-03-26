import type { CutListItem } from './cut-list';
import type { StockType } from '$lib/data/tubing-presets';
import type { TabletopConfig, TabletopMaterial } from '$lib/stores/table.svelte';

export interface ProfileSummary {
	tubeLabel: string;
	width: number;
	height: number;
	thickness: number;
	totalInches: number;
	totalFeet: number;
	weight: number;
	costPerFoot?: number;
	totalCost?: number;
}

export interface MaterialsSummary {
	byProfile: ProfileSummary[];
	totalWeight: number;
	totalCost: number;
}

function profileKey(w: number, h: number, t: number, st: StockType): string {
	return `${st}-${w}-${h}-${t}`;
}

/** Steel density: 490 lb/ft^3 = 490/1728 lb/in^3 */
const STEEL_DENSITY_PER_CUBIC_INCH = 490 / 1728;

/** Density in lb/ft^3 by tabletop material */
const TABLETOP_DENSITY: Record<TabletopMaterial, number> = {
	'none': 0,
	'steel-plate': 490,
	'diamond-plate': 490,
	'expanded-metal': 294, // ~60% of solid steel
	'wood-butcher-block': 45,
	'plywood': 35,
	'mdf': 48,
};

/** Compute tabletop weight in pounds given the full top dimensions (including overhang) */
export function computeTabletopWeight(
	topWidth: number,
	topDepth: number,
	tabletop: TabletopConfig
): number {
	if (tabletop.material === 'none') return 0;
	const volumeCubicIn = topWidth * topDepth * tabletop.thickness;
	const densityPerCubicIn = TABLETOP_DENSITY[tabletop.material] / 1728;
	return volumeCubicIn * densityPerCubicIn;
}

export function computeMaterials(
	items: CutListItem[],
	costPerFoot?: Record<string, number>
): MaterialsSummary {
	const grouped = new Map<
		string,
		{ width: number; height: number; thickness: number; stockType: StockType; tubeLabel: string; totalInches: number; density?: number }
	>();

	for (const item of items) {
		const key = profileKey(item.width, item.height, item.thickness, item.stockType) + (item.density ? `-d${item.density}` : '');
		const existing = grouped.get(key);
		const linearInches = item.length * item.quantity;

		if (existing) {
			existing.totalInches += linearInches;
		} else {
			grouped.set(key, {
				width: item.width,
				height: item.height,
				thickness: item.thickness,
				stockType: item.stockType,
				tubeLabel: item.tubeLabel,
				totalInches: linearInches,
				density: item.density
			});
		}
	}

	const byProfile: ProfileSummary[] = [];
	let totalWeight = 0;
	let totalCost = 0;

	for (const entry of grouped.values()) {
		const { width: w, height: h, thickness: t } = entry;
		const totalFeet = entry.totalInches / 12;

		// Cross-section area: solid for flat bar, hollow for tube, annular for round
		let crossSection: number;
		if (entry.stockType === 'flat-bar') {
			crossSection = w * h;
		} else if (entry.stockType === 'round') {
			const od = w;
			const id = od - 2 * t;
			crossSection = (Math.PI / 4) * (od * od - id * id);
		} else {
			crossSection = w * h - (w - 2 * t) * (h - 2 * t);
		}
		// Volume in cubic inches, then multiply by density
		const densityPerCubicIn = entry.density ? entry.density / 1728 : STEEL_DENSITY_PER_CUBIC_INCH;
		const weight = crossSection * entry.totalInches * densityPerCubicIn;

		const cpf = costPerFoot?.[entry.tubeLabel];
		const lineCost = cpf !== undefined ? cpf * totalFeet : undefined;

		const summary: ProfileSummary = {
			tubeLabel: entry.tubeLabel,
			width: w,
			height: h,
			thickness: t,
			totalInches: entry.totalInches,
			totalFeet,
			weight
		};

		if (cpf !== undefined) {
			summary.costPerFoot = cpf;
			summary.totalCost = lineCost;
		}

		totalWeight += weight;
		if (lineCost !== undefined) totalCost += lineCost;

		byProfile.push(summary);
	}

	return { byProfile, totalWeight, totalCost };
}
