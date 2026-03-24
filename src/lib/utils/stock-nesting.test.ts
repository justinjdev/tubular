import { describe, it, expect } from 'vitest';
import { computeNesting, type CutPiece } from './stock-nesting';
import type { CutListItem } from './cut-list';

function makeItem(overrides: Partial<CutListItem> = {}): CutListItem {
	return {
		group: 'Legs',
		description: 'Leg',
		tubeLabel: '2" × 2" (0.075")',
		stockType: 'tube',
		width: 2,
		height: 2,
		thickness: 0.075,
		length: 28,
		quantity: 4,
		...overrides
	};
}

const key = 'tube-2-2-0.075';

describe('computeNesting', () => {
	it('packs 4 x 28" legs into 96" sticks (2 per stick = 2 sticks)', () => {
		const items = [makeItem({ length: 28, quantity: 4 })];
		const result = computeNesting(items, { [key]: 96 });
		expect(result.profiles).toHaveLength(1);
		const p = result.profiles[0];
		// 96 / 28 = 3.4, so 3 fit per stick. 4 pieces → 2 sticks (3 + 1)
		expect(p.totalSticks).toBe(2);
	});

	it('computes waste correctly', () => {
		const items = [makeItem({ length: 28, quantity: 4 })];
		const result = computeNesting(items, { [key]: 96 });
		const p = result.profiles[0];
		// stick 1: 3 × 28 = 84 used, 12 waste
		// stick 2: 1 × 28 = 28 used, 68 waste
		expect(p.totalUsed).toBe(112);
		expect(p.totalWaste).toBe(80); // 192 - 112
		expect(p.wastePercent).toBeCloseTo(80 / 192 * 100, 1);
	});

	it('uses first-fit-decreasing to optimize packing', () => {
		// Mix of sizes that pack better when sorted
		const items = [
			makeItem({ description: 'Long', length: 60, quantity: 2 }),
			makeItem({ description: 'Short', length: 30, quantity: 2 })
		];
		const result = computeNesting(items, { [key]: 96 });
		const p = result.profiles[0];
		// Sorted: 60, 60, 30, 30
		// Stick 1: 60 + 30 = 90 (fits in 96)
		// Stick 2: 60 + 30 = 90 (fits in 96)
		expect(p.totalSticks).toBe(2);
	});

	it('handles pieces longer than stock length', () => {
		const items = [makeItem({ length: 100, quantity: 1 })];
		const result = computeNesting(items, { [key]: 96 });
		const p = result.profiles[0];
		expect(p.totalSticks).toBe(1);
		// Over-length piece: waste is negative (piece.length - stockLength)
		expect(p.sticks[0].used).toBe(100);
	});

	it('groups different profiles separately', () => {
		const items = [
			makeItem({ width: 2, height: 2, thickness: 0.075, length: 28, quantity: 4 }),
			makeItem({
				width: 1, height: 1, thickness: 0.075,
				stockType: 'tube',
				tubeLabel: '1" × 1" (0.075")',
				description: 'Brace',
				length: 56, quantity: 1
			})
		];
		const result = computeNesting(items, {
			[key]: 96,
			'tube-1-1-0.075': 72
		});
		expect(result.profiles).toHaveLength(2);
	});

	it('defaults to 96" stock when no length specified', () => {
		const items = [makeItem({ length: 28, quantity: 1 })];
		const result = computeNesting(items, {});
		expect(result.profiles[0].stockLength).toBe(96);
	});
});
