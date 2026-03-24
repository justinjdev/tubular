import { describe, it, expect } from 'vitest';
import { computeMaterials } from './materials';
import type { CutListItem } from './cut-list';

function makeItem(overrides: Partial<CutListItem> = {}): CutListItem {
	return {
		group: 'Legs',
		description: 'Leg',
		tubeLabel: '2" \u00d7 2" (0.075")',
		width: 2,
		height: 2,
		thickness: 0.075,
		length: 28,
		quantity: 4,
		...overrides
	};
}

describe('computeMaterials', () => {
	it('computes total linear inches per profile', () => {
		const items: CutListItem[] = [
			makeItem({ length: 28, quantity: 4 }),
			makeItem({ length: 60, quantity: 2 })
		];
		const result = computeMaterials(items);
		// Same profile: 28*4 + 60*2 = 112 + 120 = 232
		expect(result.byProfile).toHaveLength(1);
		expect(result.byProfile[0].totalInches).toBe(232);
	});

	it('computes total linear feet', () => {
		const items: CutListItem[] = [makeItem({ length: 24, quantity: 1 })];
		const result = computeMaterials(items);
		expect(result.byProfile[0].totalFeet).toBe(2);
	});

	it('computes weight within expected range for steel tube', () => {
		// Single 2x2x0.075 tube, 12 inches long (1 foot)
		const items: CutListItem[] = [makeItem({ length: 12, quantity: 1 })];
		const result = computeMaterials(items);

		// Cross section = 2*2 - (2-0.15)*(2-0.15) = 4 - 1.85*1.85 = 4 - 3.4225 = 0.5775 in^2
		// Volume = 0.5775 * 12 = 6.93 in^3
		// Weight = 6.93 * (490/1728) ~ 6.93 * 0.2836 ~ 1.965 lbs
		expect(result.byProfile[0].weight).toBeGreaterThan(1.9);
		expect(result.byProfile[0].weight).toBeLessThan(2.1);
		expect(result.totalWeight).toBe(result.byProfile[0].weight);
	});

	it('groups different profiles separately', () => {
		const items: CutListItem[] = [
			makeItem({ width: 2, height: 2, thickness: 0.075, length: 28, quantity: 4 }),
			makeItem({
				width: 1,
				height: 1,
				thickness: 0.075,
				tubeLabel: '1" \u00d7 1" (0.075")',
				length: 56,
				quantity: 1
			})
		];
		const result = computeMaterials(items);
		expect(result.byProfile).toHaveLength(2);
	});

	it('computes cost when costPerFoot is provided', () => {
		const items: CutListItem[] = [makeItem({ length: 12, quantity: 1 })];
		const label = '2" \u00d7 2" (0.075")';
		const result = computeMaterials(items, { [label]: 5.0 });

		expect(result.byProfile[0].costPerFoot).toBe(5.0);
		expect(result.byProfile[0].totalCost).toBe(5.0); // 1 foot * $5
		expect(result.totalCost).toBe(5.0);
	});

	it('returns zero cost when no costPerFoot provided', () => {
		const items: CutListItem[] = [makeItem({ length: 12, quantity: 1 })];
		const result = computeMaterials(items);
		expect(result.totalCost).toBe(0);
		expect(result.byProfile[0].costPerFoot).toBeUndefined();
		expect(result.byProfile[0].totalCost).toBeUndefined();
	});
});
