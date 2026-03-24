import type { TableConfig, Side, TubeProfile } from '$lib/stores/table.svelte';
import type { StockType } from '$lib/data/tubing-presets';

export interface CutListItem {
	group: 'Top Frame' | 'Legs' | 'Bracing' | 'Center Support' | 'Gusset' | 'Shelf Frame';
	description: string;
	tubeLabel: string;
	stockType: StockType;
	width: number;
	height: number;
	thickness: number;
	length: number;
	quantity: number;
}

function stockLabel(p: TubeProfile): string {
	if (p.stockType === 'flat-bar') {
		return `${p.width}" \u00d7 ${p.height}" flat`;
	}
	return `${p.width}" \u00d7 ${p.height}" (${p.thickness}")`;
}

export function computeCutList(config: TableConfig): CutListItem[] {
	const items: CutListItem[] = [];
	const { legTube, frameTube, braceTube } = config;

	// Legs: qty 4, length = table height - frame tube height
	items.push({
		group: 'Legs',
		description: 'Leg',
		tubeLabel: stockLabel(legTube),
		stockType: legTube.stockType,
		width: legTube.width,
		height: legTube.height,
		thickness: legTube.thickness,
		length: config.height - frameTube.height - config.footAllowance,
		quantity: 4
	});

	// Top Frame - Long Rail: qty 2, full table length (X-axis)
	items.push({
		group: 'Top Frame',
		description: 'Long Rail',
		tubeLabel: stockLabel(frameTube),
		stockType: frameTube.stockType,
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
		tubeLabel: stockLabel(frameTube),
		stockType: frameTube.stockType,
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
				tubeLabel: stockLabel(braceTube),
				stockType: braceTube.stockType,
				width: braceTube.width,
				height: braceTube.height,
				thickness: braceTube.thickness,
				length: span,
				quantity: 1
			});
		} else if (braceType === 'x-brace') {
			const diagonalLength = Math.sqrt(span * span + config.braceSpan * config.braceSpan);
			items.push({
				group: 'Bracing',
				description: `X-Brace \u2014 ${sideLabel}`,
				tubeLabel: stockLabel(braceTube),
				stockType: braceTube.stockType,
				width: braceTube.width,
				height: braceTube.height,
				thickness: braceTube.thickness,
				length: diagonalLength,
				quantity: 2
			});
		}
	}

	// Center Supports
	if (config.centerSupports > 0) {
		items.push({
			group: 'Center Support',
			description: 'Cross Member',
			tubeLabel: stockLabel(frameTube),
			stockType: frameTube.stockType,
			width: frameTube.width,
			height: frameTube.height,
			thickness: frameTube.thickness,
			length: config.width - legTube.width * 2,
			quantity: config.centerSupports
		});
	}

	// Gussets — triangular plates at each leg-to-frame joint
	// Cut from flat bar stock as right triangles (hypotenuse = gussetSize * sqrt(2))
	if (config.gussets) {
		// 4 corners × 2 gussets per corner (one on each face of the leg)
		items.push({
			group: 'Gusset',
			description: 'Corner Gusset Plate',
			tubeLabel: `${config.gussetSize}" × ${config.gussetThickness}" plate`,
			stockType: 'flat-bar',
			width: config.gussetSize,
			height: config.gussetSize,
			thickness: config.gussetThickness,
			length: config.gussetSize, // square blank before trimming to triangle
			quantity: 8
		});
	}

	// Shelf Frame
	if (config.shelfFrame) {
		items.push({
			group: 'Shelf Frame',
			description: 'Long Rail',
			tubeLabel: stockLabel(braceTube),
			stockType: braceTube.stockType,
			width: braceTube.width,
			height: braceTube.height,
			thickness: braceTube.thickness,
			length: config.length - legTube.width * 2,
			quantity: 2
		});
		items.push({
			group: 'Shelf Frame',
			description: 'Short Rail',
			tubeLabel: stockLabel(braceTube),
			stockType: braceTube.stockType,
			width: braceTube.width,
			height: braceTube.height,
			thickness: braceTube.thickness,
			length: config.width - legTube.height * 2,
			quantity: 2
		});
	}

	return items;
}
