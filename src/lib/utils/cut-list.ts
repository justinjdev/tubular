import type { TableConfig, Side } from '$lib/stores/table.svelte';

export interface CutListItem {
	group: 'Top Frame' | 'Legs' | 'Bracing' | 'Shelf Frame';
	description: string;
	tubeLabel: string;
	width: number;
	height: number;
	thickness: number;
	length: number;
	quantity: number;
}

function tubeLabel(w: number, h: number, t: number): string {
	return `${w}" \u00d7 ${h}" (${t}")`;
}

export function computeCutList(config: TableConfig): CutListItem[] {
	const items: CutListItem[] = [];
	const { legTube, frameTube, braceTube } = config;

	// Legs: qty 4, length = table height - frame tube height
	items.push({
		group: 'Legs',
		description: 'Leg',
		tubeLabel: tubeLabel(legTube.width, legTube.height, legTube.thickness),
		width: legTube.width,
		height: legTube.height,
		thickness: legTube.thickness,
		length: config.height - frameTube.height,
		quantity: 4
	});

	// Top Frame - Long Rail: qty 2, full table length (X-axis)
	items.push({
		group: 'Top Frame',
		description: 'Long Rail',
		tubeLabel: tubeLabel(frameTube.width, frameTube.height, frameTube.thickness),
		width: frameTube.width,
		height: frameTube.height,
		thickness: frameTube.thickness,
		length: config.length,
		quantity: 2
	});

	// Top Frame - Short Rail: qty 2, width minus two leg widths (butt joints)
	items.push({
		group: 'Top Frame',
		description: 'Short Rail',
		tubeLabel: tubeLabel(frameTube.width, frameTube.height, frameTube.thickness),
		width: frameTube.width,
		height: frameTube.height,
		thickness: frameTube.thickness,
		length: config.width - legTube.width * 2,
		quantity: 2
	});

	// Bracing per side
	const sides: Side[] = ['front', 'back', 'left', 'right'];
	for (const side of sides) {
		const braceType = config.bracing[side];
		if (braceType === 'none') continue;

		const isLongSide = side === 'front' || side === 'back';
		// front/back span along length (X), minus leg width on each end
		// left/right span along width (Y), minus leg height on each end
		const span = isLongSide
			? config.length - legTube.width * 2
			: config.width - legTube.height * 2;

		const sideLabel = side.charAt(0).toUpperCase() + side.slice(1);

		if (braceType === 'h-brace') {
			items.push({
				group: 'Bracing',
				description: `H-Brace \u2014 ${sideLabel}`,
				tubeLabel: tubeLabel(braceTube.width, braceTube.height, braceTube.thickness),
				width: braceTube.width,
				height: braceTube.height,
				thickness: braceTube.thickness,
				length: span,
				quantity: 1
			});
		} else if (braceType === 'x-brace') {
			const verticalSpan = config.braceHeight - config.braceBottomHeight;
			const diagonalLength = Math.sqrt(span * span + verticalSpan * verticalSpan);
			items.push({
				group: 'Bracing',
				description: `X-Brace \u2014 ${sideLabel}`,
				tubeLabel: tubeLabel(braceTube.width, braceTube.height, braceTube.thickness),
				width: braceTube.width,
				height: braceTube.height,
				thickness: braceTube.thickness,
				length: diagonalLength,
				quantity: 2
			});
		}
	}

	// Shelf Frame
	if (config.shelfFrame) {
		items.push({
			group: 'Shelf Frame',
			description: 'Long Rail',
			tubeLabel: tubeLabel(braceTube.width, braceTube.height, braceTube.thickness),
			width: braceTube.width,
			height: braceTube.height,
			thickness: braceTube.thickness,
			length: config.length - legTube.width * 2,
			quantity: 2
		});
		items.push({
			group: 'Shelf Frame',
			description: 'Short Rail',
			tubeLabel: tubeLabel(braceTube.width, braceTube.height, braceTube.thickness),
			width: braceTube.width,
			height: braceTube.height,
			thickness: braceTube.thickness,
			length: config.width - legTube.height * 2,
			quantity: 2
		});
	}

	return items;
}
