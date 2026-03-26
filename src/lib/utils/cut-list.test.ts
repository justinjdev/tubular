import { describe, it, expect } from 'vitest';
import { computeCutList } from './cut-list';
import { DEFAULT_CONFIG, type TableConfig } from '$lib/stores/table.svelte';

function cfg(overrides: Partial<TableConfig> = {}): TableConfig {
	return { ...DEFAULT_CONFIG, ...overrides };
}

describe('computeCutList', () => {
	it('computes leg length as height minus frame tube height', () => {
		const items = computeCutList(cfg());
		const legs = items.find((i) => i.group === 'Legs');
		expect(legs).toBeDefined();
		expect(legs!.quantity).toBe(4);
		// height 30 - frameTube.height 2 = 28
		expect(legs!.length).toBe(28);
	});

	it('computes long frame rails at full table length', () => {
		const items = computeCutList(cfg());
		const longRail = items.find((i) => i.group === 'Top Frame' && i.description === 'Long Rail');
		expect(longRail).toBeDefined();
		expect(longRail!.quantity).toBe(2);
		expect(longRail!.length).toBe(60);
	});

	it('computes short frame rails shortened by leg width on each side', () => {
		const items = computeCutList(cfg());
		const shortRail = items.find(
			(i) => i.group === 'Top Frame' && i.description === 'Short Rail'
		);
		expect(shortRail).toBeDefined();
		expect(shortRail!.quantity).toBe(2);
		// width 30 - legTube.width 2 * 2 = 26
		expect(shortRail!.length).toBe(26);
	});

	it('computes H-brace for front side', () => {
		const config = cfg({
			bracing: { front: 'h-brace', back: 'none', left: 'none', right: 'none' }
		});
		const items = computeCutList(config);
		const hBrace = items.find(
			(i) => i.group === 'Bracing' && i.description.includes('H-Brace') && i.description.includes('Front')
		);
		expect(hBrace).toBeDefined();
		expect(hBrace!.quantity).toBe(1);
		// front is long side: width 60 - legTube.width 2 * 2 = 56
		expect(hBrace!.length).toBe(56);
	});

	it('computes X-brace diagonals for left side', () => {
		const config = cfg({
			bracing: { front: 'none', back: 'none', left: 'x-brace', right: 'none' }
		});
		const items = computeCutList(config);
		const xBrace = items.find(
			(i) => i.group === 'Bracing' && i.description.includes('X-Brace') && i.description.includes('Left')
		);
		expect(xBrace).toBeDefined();
		expect(xBrace!.quantity).toBe(2);
		// left is short side: span = width 30 - legTube.height 2 * 2 = 26
		// braceSpan = 8, diagonal = sqrt(26^2 + 8^2) = sqrt(740)
		expect(xBrace!.length).toBeCloseTo(Math.sqrt(740), 6);
	});

	it('computes X-brace with custom braceSpan', () => {
		const config = cfg({
			bracing: { front: 'none', back: 'none', left: 'x-brace', right: 'none' },
			braceBottom: 4,
			braceSpan: 6
		});
		const items = computeCutList(config);
		const xBrace = items.find(
			(i) => i.group === 'Bracing' && i.description.includes('X-Brace')
		);
		expect(xBrace).toBeDefined();
		// braceSpan = 6, span = 26
		// diagonal = sqrt(26^2 + 6^2) = sqrt(676 + 36) = sqrt(712)
		expect(xBrace!.length).toBeCloseTo(Math.sqrt(712), 6);
	});

	it('includes shelf frame rails when enabled', () => {
		const config = cfg({ shelfFrame: true });
		const items = computeCutList(config);
		const shelfLong = items.find(
			(i) => i.group === 'Shelf Frame' && i.description === 'Long Rail'
		);
		const shelfShort = items.find(
			(i) => i.group === 'Shelf Frame' && i.description === 'Short Rail'
		);
		expect(shelfLong).toBeDefined();
		expect(shelfLong!.quantity).toBe(2);
		// length 60 - legTube.width 2 * 2 = 56
		expect(shelfLong!.length).toBe(56);

		expect(shelfShort).toBeDefined();
		expect(shelfShort!.quantity).toBe(2);
		// width 30 - legTube.height 2 * 2 = 26
		expect(shelfShort!.length).toBe(26);
	});

	it('returns no bracing items when all sides are none', () => {
		const items = computeCutList(cfg());
		const bracing = items.filter((i) => i.group === 'Bracing');
		expect(bracing).toHaveLength(0);
	});

	it('formats tubeLabel correctly', () => {
		const items = computeCutList(cfg());
		const legs = items.find((i) => i.group === 'Legs');
		expect(legs!.tubeLabel).toBe('2" \u00d7 2" (0.075")');
	});
});
