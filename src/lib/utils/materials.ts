import type { CutListItem } from './cut-list';
import type { StockType } from '$lib/data/tubing-presets';

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

export function computeMaterials(
	items: CutListItem[],
	costPerFoot?: Record<string, number>
): MaterialsSummary {
	const grouped = new Map<
		string,
		{ width: number; height: number; thickness: number; stockType: StockType; tubeLabel: string; totalInches: number }
	>();

	for (const item of items) {
		const key = profileKey(item.width, item.height, item.thickness, item.stockType);
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
				totalInches: linearInches
			});
		}
	}

	const byProfile: ProfileSummary[] = [];
	let totalWeight = 0;
	let totalCost = 0;

	for (const entry of grouped.values()) {
		const { width: w, height: h, thickness: t } = entry;
		const totalFeet = entry.totalInches / 12;

		// Cross-section area: solid for flat bar, hollow for tube
		const crossSection = entry.stockType === 'flat-bar'
			? w * h
			: w * h - (w - 2 * t) * (h - 2 * t);
		// Volume in cubic inches, then multiply by density
		const weight = crossSection * entry.totalInches * STEEL_DENSITY_PER_CUBIC_INCH;

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
