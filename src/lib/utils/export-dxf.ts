import type { TableConfig } from '$lib/stores/table.svelte';
import { resolvedLegDimensions } from '$lib/stores/table.svelte';
import { computeCutList } from '$lib/utils/cut-list';

// ---------------------------------------------------------------------------
// DXF primitive helpers
// ---------------------------------------------------------------------------

function line(x1: number, y1: number, x2: number, y2: number, layer = '0'): string {
	return `0
LINE
8
${layer}
10
${x1}
20
${y1}
30
0
11
${x2}
21
${y2}
31
0
`;
}

function text(x: number, y: number, height: number, content: string, layer = '0'): string {
	return `0
TEXT
8
${layer}
10
${x}
20
${y}
30
0
40
${height}
1
${content}
`;
}

function rect(x: number, y: number, w: number, h: number, layer = '0'): string {
	return (
		line(x, y, x + w, y, layer) +
		line(x + w, y, x + w, y + h, layer) +
		line(x + w, y + h, x, y + h, layer) +
		line(x, y + h, x, y, layer)
	);
}

function circle(cx: number, cy: number, r: number, layer = '0'): string {
	return `0
CIRCLE
8
${layer}
10
${cx}
20
${cy}
30
0
40
${r}
`;
}

function triangle(
	x1: number, y1: number,
	x2: number, y2: number,
	x3: number, y3: number,
	layer = '0'
): string {
	return line(x1, y1, x2, y2, layer) + line(x2, y2, x3, y3, layer) + line(x3, y3, x1, y1, layer);
}

/** Dashed rectangle using short line segments to simulate DASHED linetype */
function dashedRect(x: number, y: number, w: number, h: number, layer = '0', dashLen = 0.5, gapLen = 0.25): string {
	let out = '';
	out += dashedLine(x, y, x + w, y, layer, dashLen, gapLen);
	out += dashedLine(x + w, y, x + w, y + h, layer, dashLen, gapLen);
	out += dashedLine(x + w, y + h, x, y + h, layer, dashLen, gapLen);
	out += dashedLine(x, y + h, x, y, layer, dashLen, gapLen);
	return out;
}

function dashedLine(x1: number, y1: number, x2: number, y2: number, layer = '0', dashLen = 0.5, gapLen = 0.25): string {
	const dx = x2 - x1;
	const dy = y2 - y1;
	const totalLen = Math.sqrt(dx * dx + dy * dy);
	if (totalLen === 0) return '';
	const ux = dx / totalLen;
	const uy = dy / totalLen;
	let out = '';
	let pos = 0;
	while (pos < totalLen) {
		const segEnd = Math.min(pos + dashLen, totalLen);
		out += line(
			x1 + ux * pos, y1 + uy * pos,
			x1 + ux * segEnd, y1 + uy * segEnd,
			layer
		);
		pos = segEnd + gapLen;
	}
	return out;
}

/**
 * Dimension line with leader lines and centered text.
 * For a horizontal dim: draws two short perpendicular ticks at the endpoints,
 * a line between them, and text centered above.
 */
function dimHorizontal(x1: number, x2: number, y: number, label: string, layer = '0', textH = 1.5): string {
	const tickLen = textH * 0.8;
	let out = '';
	// Ticks
	out += line(x1, y - tickLen / 2, x1, y + tickLen / 2, layer);
	out += line(x2, y - tickLen / 2, x2, y + tickLen / 2, layer);
	// Leader line
	out += line(x1, y, x2, y, layer);
	// Text centered above the leader
	out += text((x1 + x2) / 2 - textH * label.length * 0.3, y + tickLen * 0.6, textH, label, layer);
	return out;
}

function dimVertical(y1: number, y2: number, x: number, label: string, layer = '0', textH = 1.5): string {
	const tickLen = textH * 0.8;
	let out = '';
	// Ticks
	out += line(x - tickLen / 2, y1, x + tickLen / 2, y1, layer);
	out += line(x - tickLen / 2, y2, x + tickLen / 2, y2, layer);
	// Leader line
	out += line(x, y1, x, y2, layer);
	// Text to the right of the leader
	out += text(x + tickLen * 0.6, (y1 + y2) / 2 - textH / 2, textH, label, layer);
	return out;
}

// ---------------------------------------------------------------------------
// DXF HEADER + TABLES (layer definitions)
// ---------------------------------------------------------------------------

interface LayerDef {
	name: string;
	color: number;
}

const LAYERS: LayerDef[] = [
	{ name: 'TABLE', color: 7 },
	{ name: 'LEGS', color: 1 },
	{ name: 'BRACING', color: 3 },
	{ name: 'GUSSETS', color: 4 },
	{ name: 'SUPPORTS', color: 5 },
	{ name: 'TABLETOP', color: 6 },
	{ name: 'DRAWERS', color: 8 },
	{ name: 'DIMS', color: 2 },
	{ name: 'PARTS', color: 7 },
];

function buildHeader(): string {
	return `0
SECTION
2
HEADER
9
$INSUNITS
70
1
9
$MEASUREMENT
70
0
0
ENDSEC
`;
}

function buildTables(): string {
	let layerEntries = '';
	for (const l of LAYERS) {
		layerEntries += `0
LAYER
2
${l.name}
70
0
62
${l.color}
6
CONTINUOUS
`;
	}
	return `0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
${LAYERS.length}
${layerEntries}0
ENDTAB
0
ENDSEC
`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function exportDXF(config: TableConfig): void {
	const { width, depth } = config;
	const { legW, legH } = resolvedLegDimensions(config);

	let entities = '';

	// -----------------------------------------------------------------------
	// ASSEMBLY DRAWING — Plan (top-down) view
	// Origin at (0, 0), X = width direction, Y = depth direction
	// -----------------------------------------------------------------------

	// Outer table frame
	entities += rect(0, 0, width, depth, 'TABLE');

	// Leg rectangles at four corners
	entities += rect(0, 0, legW, legH, 'LEGS');                           // front-left
	entities += rect(width - legW, 0, legW, legH, 'LEGS');                // front-right
	entities += rect(0, depth - legH, legW, legH, 'LEGS');                // back-left
	entities += rect(width - legW, depth - legH, legW, legH, 'LEGS');     // back-right

	// ------- Center supports -------
	if (config.centerSupports > 0) {
		const innerW = width - legW * 2;
		for (let i = 1; i <= config.centerSupports; i++) {
			const cx = legW + innerW * i / (config.centerSupports + 1);
			// Vertical line from inside-front leg to inside-back leg
			entities += line(cx, legH, cx, depth - legH, 'SUPPORTS');
		}
	}

	// ------- Bracing (plan view: show as lines inset from outer edge) -------
	const sides: Array<'front' | 'back' | 'left' | 'right'> = ['front', 'back', 'left', 'right'];
	for (const side of sides) {
		const braceType = config.bracing[side];
		if (braceType === 'none') continue;

		let bx1: number, by1: number, bx2: number, by2: number;

		if (side === 'front') {
			// Bottom edge, inset by legW on each end, slightly inside the frame
			bx1 = legW; by1 = legH;
			bx2 = width - legW; by2 = legH;
		} else if (side === 'back') {
			bx1 = legW; by1 = depth - legH;
			bx2 = width - legW; by2 = depth - legH;
		} else if (side === 'left') {
			bx1 = legW; by1 = legH;
			bx2 = legW; by2 = depth - legH;
		} else {
			// right
			bx1 = width - legW; by1 = legH;
			bx2 = width - legW; by2 = depth - legH;
		}

		if (braceType === 'h-brace') {
			entities += line(bx1, by1, bx2, by2, 'BRACING');
		} else if (braceType === 'x-brace') {
			if (side === 'front' || side === 'back') {
				// X on the horizontal span — show two crossing diagonals offset slightly
				const offset = 1; // small offset into the table to show the X
				const yInner = side === 'front' ? by1 + offset : by1 - offset;
				entities += line(bx1, by1, bx2, yInner, 'BRACING');
				entities += line(bx1, yInner, bx2, by1, 'BRACING');
			} else {
				const offset = 1;
				const xInner = side === 'left' ? bx1 + offset : bx1 - offset;
				entities += line(bx1, by1, xInner, by2, 'BRACING');
				entities += line(xInner, by1, bx1, by2, 'BRACING');
			}
		}
	}

	// ------- Gussets (small right triangles at inside corners) -------
	const gW = config.gussetWidth;
	const gH = config.gussetHeight;

	if (config.gussets.front) {
		// front-left inside corner: right angle at (legW, legH), extends right and up
		entities += triangle(legW, legH, legW + gW, legH, legW, legH + gH, 'GUSSETS');
		// front-right inside corner: right angle at (width-legW, legH), extends left and up
		entities += triangle(width - legW, legH, width - legW - gW, legH, width - legW, legH + gH, 'GUSSETS');
	}
	if (config.gussets.back) {
		// back-left
		entities += triangle(legW, depth - legH, legW + gW, depth - legH, legW, depth - legH - gH, 'GUSSETS');
		// back-right
		entities += triangle(width - legW, depth - legH, width - legW - gW, depth - legH, width - legW, depth - legH - gH, 'GUSSETS');
	}
	if (config.gussets.left) {
		// left-front
		entities += triangle(legW, legH, legW + gW, legH, legW, legH + gH, 'GUSSETS');
		// left-back
		entities += triangle(legW, depth - legH, legW + gW, depth - legH, legW, depth - legH - gH, 'GUSSETS');
	}
	if (config.gussets.right) {
		// right-front
		entities += triangle(width - legW, legH, width - legW - gW, legH, width - legW, legH + gH, 'GUSSETS');
		// right-back
		entities += triangle(width - legW, depth - legH, width - legW - gW, depth - legH, width - legW, depth - legH - gH, 'GUSSETS');
	}

	// ------- Tabletop outline (dashed, showing overhang) -------
	if (config.tabletop.material !== 'none') {
		const top = config.tabletop;
		const tx = -top.overhangLeft;
		const ty = -top.overhangFront;
		const tw = width + top.overhangLeft + top.overhangRight;
		const td = depth + top.overhangFront + top.overhangBack;
		entities += dashedRect(tx, ty, tw, td, 'TABLETOP');
	}

	// ------- Drawer outlines (dashed, in each bay) -------
	if (config.drawers.length > 0) {
		const innerW = width - legW * 2;
		const numBays = config.centerSupports + 1;
		const bayWidth = innerW / numBays;

		for (let bayIdx = 0; bayIdx < numBays; bayIdx++) {
			const bayDrawers = config.drawers[bayIdx]?.drawers ?? [];
			if (bayDrawers.length === 0) continue;

			const bayLeft = legW + bayIdx * bayWidth;
			const drawerW = bayWidth - config.drawerSlideGap * 2;
			const drawerX = bayLeft + config.drawerSlideGap;
			const drawerY = legH + config.drawerFrontInset;
			const drawerD = config.drawerDepth;

			entities += dashedRect(drawerX, drawerY, drawerW, drawerD, 'DRAWERS');
		}
	}

	// ------- Dimension lines -------
	const textH = Math.max(1, Math.min(width, depth) * 0.035);
	const dimOffset = textH * 3;

	// Overall width — below the drawing
	entities += dimHorizontal(0, width, -dimOffset, `${width}"`, 'DIMS', textH);

	// Overall depth — to the right of the drawing
	entities += dimVertical(0, depth, width + dimOffset, `${depth}"`, 'DIMS', textH);

	// Height annotation — centered in drawing
	entities += text(width / 2 - textH * 3, depth / 2, textH, `H: ${config.height}"`, 'DIMS');

	// Bay widths if center supports exist
	if (config.centerSupports > 0) {
		const innerW = width - legW * 2;
		const numBays = config.centerSupports + 1;
		const bayWidth = innerW / numBays;
		const bayDimY = -dimOffset - textH * 3;

		for (let i = 0; i < numBays; i++) {
			const bx1 = legW + i * bayWidth;
			const bx2 = bx1 + bayWidth;
			entities += dimHorizontal(bx1, bx2, bayDimY, `${bayWidth.toFixed(2)}"`, 'DIMS', textH * 0.8);
		}
	}

	// -----------------------------------------------------------------------
	// INDIVIDUAL PART DRAWINGS
	// Below the assembly, offset by a gap
	// -----------------------------------------------------------------------
	const partGap = 10; // gap between assembly and parts area
	const partStartY = -dimOffset - (config.centerSupports > 0 ? textH * 6 : textH * 3) - partGap;
	const partSpacing = 3; // horizontal gap between parts
	const maxRowWidth = 120;
	const partTextH = textH * 0.7;

	const cutList = computeCutList(config);

	// Deduplicate by description (computeCutList already groups by unique parts)
	let cursorX = 0;
	let cursorY = partStartY;
	let rowMaxH = 0;

	// Title for parts section
	entities += text(0, cursorY + textH * 1.5, textH * 1.2, 'INDIVIDUAL PARTS', 'PARTS');
	cursorY -= textH * 3;

	for (const part of cutList) {
		let partW: number;
		let partH: number;
		const isGusset = part.group === 'Gusset';
		const isRound = part.stockType === 'round';
		const isTabletop = part.group === 'Tabletop';

		if (isGusset) {
			partW = part.width;
			partH = part.height;
		} else if (isTabletop) {
			// Draw tabletop as a rectangle: width × length
			partW = part.width;
			partH = part.length;
		} else if (isRound) {
			// For round tubes, draw a circle with diameter = width, and show length as text
			partW = part.width;
			partH = part.width;
		} else {
			// Rectangular tube: length × width (profile width)
			partW = part.length;
			partH = part.width;
		}

		// Check if we need to wrap to the next row
		if (cursorX + partW > maxRowWidth && cursorX > 0) {
			cursorX = 0;
			cursorY -= rowMaxH + partSpacing + textH * 4;
			rowMaxH = 0;
		}

		// Draw the part
		const px = cursorX;
		const py = cursorY - partH;

		if (isGusset) {
			// Right triangle
			entities += triangle(px, py, px + partW, py, px, py + partH, 'PARTS');
		} else if (isRound) {
			// Circle
			const r = partW / 2;
			entities += circle(px + r, py + r, r, 'PARTS');
		} else {
			// Rectangle
			entities += rect(px, py, partW, partH, 'PARTS');
		}

		// Label: description
		entities += text(px, py - partTextH * 1.2, partTextH, part.description, 'PARTS');

		// Dimensions text
		let dimLabel: string;
		if (isGusset) {
			dimLabel = `${part.width}" x ${part.height}" x ${part.thickness}"`;
		} else if (isRound) {
			dimLabel = `${part.width}" OD x ${part.length}" L`;
		} else if (isTabletop) {
			dimLabel = `${part.width}" x ${part.length}" x ${part.thickness}"`;
		} else {
			dimLabel = `${part.width}" x ${part.height}" x ${part.length}"`;
		}
		entities += text(px, py - partTextH * 2.6, partTextH * 0.85, dimLabel, 'PARTS');

		// Quantity
		entities += text(px, py - partTextH * 3.8, partTextH * 0.85, `Qty: ${part.quantity}`, 'PARTS');

		// Joint note if present
		if (part.jointNote) {
			entities += text(px, py - partTextH * 5, partTextH * 0.7, part.jointNote, 'PARTS');
		}

		if (partH > rowMaxH) rowMaxH = partH;
		cursorX += partW + partSpacing;
	}

	// -----------------------------------------------------------------------
	// Assemble final DXF
	// -----------------------------------------------------------------------
	const dxf = `999
DXF generated by Tubular
${buildHeader()}${buildTables()}0
SECTION
2
ENTITIES
${entities}0
ENDSEC
0
EOF
`;

	const blob = new Blob([dxf], { type: 'application/dxf' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'tubular-plan.dxf';
	a.click();
	URL.revokeObjectURL(url);
}
