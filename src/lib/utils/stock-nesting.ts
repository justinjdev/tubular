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
 */
function nestProfile(
	pieces: CutPiece[],
	stockLength: number,
	kerf: number
): StockStick[] {
	// Sort longest first for better packing
	const sorted = [...pieces].sort((a, b) => b.length - a.length);
	const sticks: StockStick[] = [];

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
		let placed = false;
		for (const stick of sticks) {
			const remaining = stockLength - stick.used;
			if (remaining >= piece.length + kerf) {
				stick.pieces.push(piece);
				stick.used += piece.length + kerf;
				stick.waste = stockLength - stick.used;
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

	return sticks;
}

/**
 * Compute stock nesting for all cut list items grouped by profile.
 */
export function computeNesting(
	items: CutListItem[],
	stockLengths: Record<string, number>, // keyed by profile key (w-h-t-type)
	kerf: number = 0.125 // saw blade width in inches
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

		const sticks = nestProfile(pieces, stockLength, kerf);
		const totalUsed = sticks.reduce((sum, s) => sum + s.used, 0);
		const totalStock = sticks.length * stockLength;
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
