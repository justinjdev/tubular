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
	it('packs 4 x 28" legs into 96" sticks with default kerf (2 per stick = 2 sticks)', () => {
		const items = [makeItem({ length: 28, quantity: 4 })];
		const result = computeNesting(items, { [key]: 96 });
		expect(result.profiles).toHaveLength(1);
		const p = result.profiles[0];
		// With 0.125" kerf: each piece uses 28.125"
		// 96 / 28.125 = 3.41, so 3 fit per stick. 4 pieces → 2 sticks (3 + 1)
		expect(p.totalSticks).toBe(2);
	});

	it('computes waste correctly with kerf', () => {
		const items = [makeItem({ length: 28, quantity: 4 })];
		const result = computeNesting(items, { [key]: 96 });
		const p = result.profiles[0];
		// stick 1: 3 × (28 + 0.125) = 84.375 used
		// stick 2: 1 × (28 + 0.125) = 28.125 used
		// total used = 112.5
		expect(p.totalUsed).toBe(112.5);
		expect(p.totalWaste).toBe(192 - 112.5); // 79.5
		expect(p.wastePercent).toBeCloseTo((79.5 / 192) * 100, 1);
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
		// Stick 1: 60 + 0.125 = 60.125 used, remaining = 35.875, 30 + 0.125 = 30.125 fits → 90.25
		// Stick 2: 60 + 0.125 = 60.125 used, remaining = 35.875, 30 + 0.125 = 30.125 fits → 90.25
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

	it('accounts for kerf between pieces on a stick', () => {
		// Two 47.5" pieces with 0.125" kerf: 47.5 + 0.125 + 47.5 + 0.125 = 95.25
		// Should fit on a 96" stick
		const items = [makeItem({ length: 47.5, quantity: 2 })];
		const result = computeNesting(items, { [key]: 96 });
		expect(result.profiles[0].totalSticks).toBe(1);
	});

	it('rejects pieces that exceed stock with kerf', () => {
		// Two 48" pieces with 0.125" kerf: 48 + 0.125 + 48 + 0.125 = 96.25
		// Should NOT fit on a 96" stick
		const items = [makeItem({ length: 48, quantity: 2 })];
		const result = computeNesting(items, { [key]: 96 });
		expect(result.profiles[0].totalSticks).toBe(2);
	});

	it('works with zero kerf', () => {
		// Two 48" pieces with 0 kerf: 48 + 48 = 96, should fit on one 96" stick
		const items = [makeItem({ length: 48, quantity: 2 })];
		const result = computeNesting(items, { [key]: 96 }, 0);
		expect(result.profiles[0].totalSticks).toBe(1);
	});

	it('uses custom kerf value when provided', () => {
		// Two 47" pieces with 1" kerf: 47 + 1 + 47 + 1 = 96 → fits
		const items = [makeItem({ length: 47, quantity: 2 })];
		const result = computeNesting(items, { [key]: 96 }, 1);
		expect(result.profiles[0].totalSticks).toBe(1);

		// Two 47.5" pieces with 1" kerf: 47.5 + 1 + 47.5 + 1 = 97 → doesn't fit
		const items2 = [makeItem({ length: 47.5, quantity: 2 })];
		const result2 = computeNesting(items2, { [key]: 96 }, 1);
		expect(result2.profiles[0].totalSticks).toBe(2);
	});
});
