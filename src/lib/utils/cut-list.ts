import type { TableConfig, Side, TubeProfile } from '$lib/stores/table.svelte';
import { resolvedLegDimensions } from '$lib/stores/table.svelte';
import type { StockType } from '$lib/data/tubing-presets';

export interface CutListItem {
	group: 'Top Frame' | 'Legs' | 'Bracing' | 'Center Support' | 'Gusset' | 'Shelf Frame' | 'Tabletop';
	description: string;
	tubeLabel: string;
	stockType: StockType;
	width: number;
	height: number;
	thickness: number;
	length: number;
	quantity: number;
	/** Override density in lb/ft^3 (defaults to steel: 490) */
	density?: number;
	/** Note about the joint type, e.g. "coped ends" or "miter 45°" */
	jointNote?: string;
}

function stockLabel(p: TubeProfile): string {
	if (p.stockType === 'flat-bar') {
		return `${p.width}" \u00d7 ${p.height}" flat`;
	}
	if (p.stockType === 'round') {
		return `${p.width}" OD (${p.thickness}")`;
	}
	return `${p.width}" \u00d7 ${p.height}" (${p.thickness}")`;
}

export function computeCutList(config: TableConfig): CutListItem[] {
	const items: CutListItem[] = [];
	const { legTube, frameTube, braceTube } = config;
	const { legW, legH } = resolvedLegDimensions(config);
	const joints = config.weldJoints ?? { legToFrame: 'butt', braceToLeg: 'butt', frameCorners: 'butt' };

	// Legs: qty 4, length = table height - frame tube height
	let legLength = config.height - frameTube.height;
	let legJointNote: string | undefined;
	if (joints.legToFrame === 'cope') {
		legLength += frameTube.height / 2;
		legJointNote = 'coped top end';
	}
	items.push({
		group: 'Legs',
		description: 'Leg',
		tubeLabel: stockLabel(legTube),
		stockType: legTube.stockType,
		width: legTube.width,
		height: legTube.height,
		thickness: legTube.thickness,
		length: legLength,
		quantity: 4,
		jointNote: legJointNote
	});

	// Top Frame - Long Rail and Short Rail
	let longRailLength: number;
	let shortRailLength: number;
	let longJointNote: string | undefined;
	let shortJointNote: string | undefined;

	if (joints.frameCorners === 'miter') {
		// Both rails shortened — they meet at 45° miters at each corner
		longRailLength = config.width - frameTube.width;
		shortRailLength = config.depth - frameTube.width;
		longJointNote = 'miter 45° both ends';
		shortJointNote = 'miter 45° both ends';
	} else if (joints.frameCorners === 'cope') {
		// Long rails stay full length, short rails coped ends wrap around long rails
		longRailLength = config.width;
		shortRailLength = config.depth - legW * 2 + frameTube.width;
		shortJointNote = 'coped ends';
	} else {
		// Butt (default) — short rails butt into long rails inside legs
		longRailLength = config.width;
		shortRailLength = config.depth - legW * 2;
	}

	items.push({
		group: 'Top Frame',
		description: 'Long Rail',
		tubeLabel: stockLabel(frameTube),
		stockType: frameTube.stockType,
		width: frameTube.width,
		height: frameTube.height,
		thickness: frameTube.thickness,
		length: longRailLength,
		quantity: 2,
		jointNote: longJointNote
	});

	items.push({
		group: 'Top Frame',
		description: 'Short Rail',
		tubeLabel: stockLabel(frameTube),
		stockType: frameTube.stockType,
		width: frameTube.width,
		height: frameTube.height,
		thickness: frameTube.thickness,
		length: shortRailLength,
		quantity: 2,
		jointNote: shortJointNote
	});

	// Bracing per side
	const sides: Side[] = ['front', 'back', 'left', 'right'];
	for (const side of sides) {
		const braceType = config.bracing[side];
		if (braceType === 'none') continue;

		const isLongSide = side === 'front' || side === 'back';
		// front/back span along width (X), minus leg width on each end
		// left/right span along depth (Z), minus leg height on each end
		const span = isLongSide
			? config.width - legW * 2
			: config.depth - legH * 2;

		const sideLabel = side.charAt(0).toUpperCase() + side.slice(1);

		let braceJointNote: string | undefined;
		let braceAdjust = 0;
		if (joints.braceToLeg === 'cope') {
			braceAdjust = legTube.width;
			braceJointNote = 'coped ends';
		} else if (joints.braceToLeg === 'fish-mouth') {
			braceAdjust = legTube.width;
			braceJointNote = 'fish-mouth ends';
		}

		if (braceType === 'h-brace') {
			items.push({
				group: 'Bracing',
				description: `H-Brace \u2014 ${sideLabel}`,
				tubeLabel: stockLabel(braceTube),
				stockType: braceTube.stockType,
				width: braceTube.width,
				height: braceTube.height,
				thickness: braceTube.thickness,
				length: span + braceAdjust,
				quantity: 1,
				jointNote: braceJointNote
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
				length: diagonalLength + braceAdjust,
				quantity: 2,
				jointNote: braceJointNote
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
			length: config.depth - legW * 2,
			quantity: config.centerSupports
		});
		items.push({
			group: 'Center Support',
			description: 'Vertical Leg',
			tubeLabel: stockLabel(legTube),
			stockType: legTube.stockType,
			width: legTube.width,
			height: legTube.height,
			thickness: legTube.thickness,
			length: config.height - frameTube.height,
			quantity: config.centerSupports * 2
		});
	}

	// Gussets — triangular plates at leg-to-frame joints
	// Each enabled face adds 2 gussets (one at each corner on that side)
	const gussetFaces = Object.values(config.gussets).filter(Boolean).length;
	if (gussetFaces > 0) {
		items.push({
			group: 'Gusset',
			description: 'Corner Gusset Plate',
			tubeLabel: `${config.gussetWidth}" × ${config.gussetHeight}" × ${config.gussetThickness}" plate`,
			stockType: 'flat-bar',
			width: config.gussetWidth,
			height: config.gussetHeight,
			thickness: config.gussetThickness,
			length: Math.max(config.gussetWidth, config.gussetHeight),
			quantity: gussetFaces * 2
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
			length: config.width - legW * 2,
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
			length: config.depth - legH * 2,
			quantity: 2
		});
	}

	// Tabletop
	if (config.tabletop.material !== 'none') {
		const top = config.tabletop;
		const topWidth = config.width + top.overhangLeft + top.overhangRight;
		const topDepth = config.depth + top.overhangFront + top.overhangBack;
		const materialLabels: Record<string, string> = {
			'steel-plate': 'Steel Plate',
			'diamond-plate': 'Diamond Plate',
			'expanded-metal': 'Expanded Metal',
			'wood-butcher-block': 'Butcher Block',
			'plywood': 'Plywood',
			'mdf': 'MDF',
		};
		const densityMap: Record<string, number> = {
			'steel-plate': 490,
			'diamond-plate': 490,
			'expanded-metal': 294,
			'wood-butcher-block': 45,
			'plywood': 35,
			'mdf': 48,
		};
		items.push({
			group: 'Tabletop',
			description: materialLabels[top.material] ?? top.material,
			tubeLabel: `${topWidth}" \u00d7 ${topDepth}" \u00d7 ${top.thickness}" ${materialLabels[top.material]?.toLowerCase() ?? top.material}`,
			stockType: 'flat-bar',
			width: topWidth,
			height: top.thickness,
			thickness: top.thickness,
			length: topDepth,
			quantity: 1,
			density: densityMap[top.material]
		});
	}

	return items;
}
