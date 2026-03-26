import type { CutListItem } from './cut-list';

export const STOCK_LENGTHS_INCHES = [48, 72, 96, 120, 240, 288]; // 4', 6', 8', 10', 20', 24'

export function stockLengthLabel(inches: number, metric: boolean): string {
	if (metric) {
		const mm = inches * 25.4;
		return mm >= 1000 ? `${(mm / 1000).toFixed(1)}m` : `${mm.toFixed(0)}mm`;
	}
	return `${inches / 12}'`;
}

export interface CutPiece {
	description: string;
	length: number;
}

export interface StockStick {
	pieces: CutPiece[];
	used: number;
	waste: number;
	isCustomDrop?: boolean;
}

export interface ProfileNesting {
	tubeLabel: string;
	stockType: string;
	width: number;
	height: number;
	thickness: number;
	stockLength: number;
	sticks: StockStick[];
	totalSticks: number;
	customSticks: number;
	totalUsed: number;
	totalWaste: number;
	wastePercent: number;
}

export interface NestingResult {
	profiles: ProfileNesting[];
}

/**
 * First-fit-decreasing bin packing.
 * Expands each CutListItem by quantity, sorts longest first,
 * then assigns each piece to the first stick that fits.
 * Kerf is added after each piece to account for saw blade width.
 *
 * Custom drops (existing stock) are used first before cutting new stock.
 */
function nestProfile(
	pieces: CutPiece[],
	stockLength: number,
	kerf: number,
	customDrops: { length: number; qty: number }[] = []
): StockStick[] {
	// Sort longest first for better packing
	const sorted = [...pieces].sort((a, b) => b.length - a.length);

	// Pre-populate sticks from custom drops (existing stock used first)
	const sticks: StockStick[] = [];
	for (const drop of customDrops) {
		for (let i = 0; i < drop.qty; i++) {
			sticks.push({
				pieces: [],
				used: 0,
				waste: drop.length,
				isCustomDrop: true
			});
		}
	}

	for (const piece of sorted) {
		if (piece.length > stockLength) {
			// Piece doesn't fit in stock — put it alone (will show as over-length)
			sticks.push({
				pieces: [piece],
				used: piece.length,
				waste: piece.length - stockLength
			});
			continue;
		}

		// Find first stick with enough remaining space (piece + kerf for the cut)
		// Custom drop sticks come first in the array, so they are tried first
		let placed = false;
		for (const stick of sticks) {
			const stickLength = stick.isCustomDrop
				? (stick.used + stick.waste) // custom drop: total = used + waste (original length)
				: stockLength;
			const remaining = stickLength - stick.used;
			if (remaining >= piece.length + kerf) {
				stick.pieces.push(piece);
				stick.used += piece.length + kerf;
				stick.waste = stickLength - stick.used;
				placed = true;
				break;
			}
		}

		if (!placed) {
			sticks.push({
				pieces: [piece],
				used: piece.length + kerf,
				waste: stockLength - piece.length - kerf
			});
		}
	}

	// Remove custom drop sticks that had no pieces placed on them (unused drops)
	return sticks.filter((s) => s.pieces.length > 0);
}

/**
 * Compute stock nesting for all cut list items grouped by profile.
 */
export function computeNesting(
	items: CutListItem[],
	stockLengths: Record<string, number>, // keyed by profile key (w-h-t-type)
	kerf: number = 0.125, // saw blade width in inches
	customDrops: Record<string, { length: number; qty: number }[]> = {}
): NestingResult {
	// Group items by profile
	const grouped = new Map<string, { items: CutListItem[]; key: string }>();

	for (const item of items) {
		const key = `${item.stockType}-${item.width}-${item.height}-${item.thickness}`;
		if (!grouped.has(key)) {
			grouped.set(key, { items: [], key });
		}
		grouped.get(key)!.items.push(item);
	}

	const profiles: ProfileNesting[] = [];

	for (const [key, { items: profileItems }] of grouped) {
		const first = profileItems[0];
		const stockLength = stockLengths[key] ?? 96; // default 8'

		// Expand quantities into individual pieces
		const pieces: CutPiece[] = [];
		for (const item of profileItems) {
			for (let i = 0; i < item.quantity; i++) {
				pieces.push({ description: item.description, length: item.length });
			}
		}

		const drops = customDrops[key] ?? [];
		const sticks = nestProfile(pieces, stockLength, kerf, drops);
		const customStickCount = sticks.filter((s) => s.isCustomDrop).length;
		const newStickCount = sticks.length - customStickCount;
		const totalUsed = sticks.reduce((sum, s) => sum + s.used, 0);
		// Total stock accounts for custom drop lengths + new stock lengths
		const totalStock = sticks.reduce((sum, s) => {
			if (s.isCustomDrop) return sum + s.used + s.waste;
			return sum + stockLength;
		}, 0);
		const totalWaste = totalStock - totalUsed;

		profiles.push({
			tubeLabel: first.tubeLabel,
			stockType: first.stockType,
			width: first.width,
			height: first.height,
			thickness: first.thickness,
			stockLength,
			sticks,
			totalSticks: sticks.length,
			customSticks: customStickCount,
			totalUsed,
			totalWaste,
			wastePercent: totalStock > 0 ? (totalWaste / totalStock) * 100 : 0
		});
	}

	return { profiles };
}

export function profileKey(item: CutListItem): string {
	return `${item.stockType}-${item.width}-${item.height}-${item.thickness}`;
}
