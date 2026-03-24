import { jsPDF } from 'jspdf';
import type { TableConfig } from '$lib/stores/table.svelte';
import type { CutListItem } from './cut-list';
import type { MaterialsSummary } from './materials';
import { inToDisplay, lengthUnit, ftToDisplay, lengthLongUnit, lbToDisplay, weightUnit } from './units';
import { toFraction } from './fractions';

/** Format a dimension with optional fraction */
function dimLabel(inches: number, metric: boolean): string {
	if (metric) return `${(inches * 25.4).toFixed(0)} mm`;
	return `${toFraction(inches)}"`;
}

/**
 * Draw a dimension line with arrows and centered label.
 * Horizontal if dir='h', vertical if dir='v'.
 */
function drawDim(
	doc: jsPDF,
	x1: number, y1: number,
	x2: number, y2: number,
	label: string,
	offset: number,
	dir: 'h' | 'v'
) {
	const arrowSize = 3;
	doc.setDrawColor(80);
	doc.setLineWidth(0.5);
	doc.setFontSize(7);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(60);

	if (dir === 'h') {
		const ly = y1 + offset;
		// Extension lines
		doc.line(x1, y1, x1, ly);
		doc.line(x2, y2, x2, ly);
		// Dimension line
		doc.line(x1 + arrowSize, ly, x2 - arrowSize, ly);
		// Arrows
		doc.line(x1, ly, x1 + arrowSize, ly - 2);
		doc.line(x1, ly, x1 + arrowSize, ly + 2);
		doc.line(x2, ly, x2 - arrowSize, ly - 2);
		doc.line(x2, ly, x2 - arrowSize, ly + 2);
		// Label
		doc.text(label, (x1 + x2) / 2, ly - 3, { align: 'center' });
	} else {
		const lx = x1 + offset;
		// Extension lines
		doc.line(x1, y1, lx, y1);
		doc.line(x2, y2, lx, y2);
		// Dimension line
		doc.line(lx, y1 + arrowSize, lx, y2 - arrowSize);
		// Arrows
		doc.line(lx, y1, lx - 2, y1 + arrowSize);
		doc.line(lx, y1, lx + 2, y1 + arrowSize);
		doc.line(lx, y2, lx - 2, y2 - arrowSize);
		doc.line(lx, y2, lx + 2, y2 - arrowSize);
		// Label (rotated)
		doc.text(label, lx - 3, (y1 + y2) / 2, { angle: 90, align: 'center' });
	}

	// Reset
	doc.setTextColor(0);
	doc.setLineWidth(1);
}

/**
 * Draw the three orthographic views: Front, Side (Right), Top
 */
function drawOrthographicViews(doc: jsPDF, config: TableConfig, startY: number): number {
	const m = config.metric;
	const pageWidth = doc.internal.pageSize.getWidth();

	// Scale factor: fit largest dimension into ~150pt
	const maxDim = Math.max(config.length, config.width, config.height);
	const scale = 140 / maxDim;

	const sL = config.length * scale;
	const sW = config.width * scale;
	const sH = config.height * scale;
	const sLegW = config.legTube.width * scale;
	const sLegH = config.legTube.height * scale;
	const sFrameH = config.frameTube.height * scale;
	const sFoot = config.footAllowance * scale;

	let y = startY;

	doc.setFontSize(11);
	doc.setFont('helvetica', 'bold');
	doc.text('Orthographic Views', 40, y);
	y += 16;

	// --- Front View (looking at the front, shows Length x Height) ---
	const frontX = 60;
	const frontY = y;

	doc.setFontSize(8);
	doc.setFont('helvetica', 'bold');
	doc.text('Front', frontX + sL / 2, frontY - 4, { align: 'center' });

	doc.setDrawColor(40);
	doc.setLineWidth(0.8);
	// Top frame rail
	doc.rect(frontX, frontY, sL, sFrameH);
	// Left leg
	doc.rect(frontX, frontY + sFrameH, sLegW, sH - sFrameH - sFoot);
	// Right leg
	doc.rect(frontX + sL - sLegW, frontY + sFrameH, sLegW, sH - sFrameH - sFoot);

	// Foot allowance dashes
	if (sFoot > 1) {
		doc.setLineDashPattern([2, 2], 0);
		const legBottom = frontY + sH - sFoot;
		doc.line(frontX, legBottom, frontX + sLegW, legBottom);
		doc.line(frontX + sL - sLegW, legBottom, frontX + sL, legBottom);
		doc.setLineDashPattern([], 0);
	}

	// Bracing on front side
	const braceType = config.bracing.front;
	if (braceType !== 'none') {
		const bLeft = frontX + sLegW;
		const bRight = frontX + sL - sLegW;
		const bTop = frontY + sH - sFoot - config.braceBottom * scale - config.braceSpan * scale;
		const bBottom = frontY + sH - sFoot - config.braceBottom * scale;
		doc.setDrawColor(120);
		doc.setLineWidth(0.5);
		if (braceType === 'h-brace') {
			const midY = (bTop + bBottom) / 2;
			doc.line(bLeft, midY, bRight, midY);
		} else if (braceType === 'x-brace') {
			doc.line(bLeft, bTop, bRight, bBottom);
			doc.line(bLeft, bBottom, bRight, bTop);
		}
		doc.setDrawColor(40);
		doc.setLineWidth(0.8);
	}

	// Gussets in front view — triangles at inside top of each leg
	if (config.gussets) {
		const sGs = config.gussetSize * scale;
		doc.setFillColor(200, 170, 100);
		// Left leg gusset (right side, hanging down from frame)
		doc.triangle(
			frontX + sLegW, frontY + sFrameH,
			frontX + sLegW + sGs, frontY + sFrameH,
			frontX + sLegW, frontY + sFrameH + sGs,
			'F'
		);
		// Right leg gusset (left side, hanging down from frame)
		doc.triangle(
			frontX + sL - sLegW, frontY + sFrameH,
			frontX + sL - sLegW - sGs, frontY + sFrameH,
			frontX + sL - sLegW, frontY + sFrameH + sGs,
			'F'
		);
	}

	// Dimensions — length (horizontal below)
	drawDim(doc, frontX, frontY + sH, frontX + sL, frontY + sH, dimLabel(config.length, m), 14, 'h');
	// Dimensions — height (vertical right)
	drawDim(doc, frontX + sL, frontY, frontX + sL, frontY + sH - sFoot, dimLabel(config.height - config.footAllowance, m), 14, 'v');
	// Total height including foot
	if (config.footAllowance > 0) {
		drawDim(doc, frontX + sL, frontY, frontX + sL, frontY + sH, dimLabel(config.height, m), 28, 'v');
	}

	// --- Side View (looking at right side, shows Width x Height) ---
	const sideX = frontX + sL + 60;
	const sideY = frontY;

	doc.setFontSize(8);
	doc.setFont('helvetica', 'bold');
	doc.text('Side', sideX + sW / 2, sideY - 4, { align: 'center' });

	doc.setDrawColor(40);
	doc.setLineWidth(0.8);
	// Top frame rail
	doc.rect(sideX, sideY, sW, sFrameH);
	// Left leg (front leg from side)
	doc.rect(sideX, sideY + sFrameH, sLegH, sH - sFrameH - sFoot);
	// Right leg (back leg from side)
	doc.rect(sideX + sW - sLegH, sideY + sFrameH, sLegH, sH - sFrameH - sFoot);

	// Bracing on right side
	const sideBrace = config.bracing.right;
	if (sideBrace !== 'none') {
		const bLeft = sideX + sLegH;
		const bRight = sideX + sW - sLegH;
		const bTop = sideY + sH - sFoot - config.braceBottom * scale - config.braceSpan * scale;
		const bBottom = sideY + sH - sFoot - config.braceBottom * scale;
		doc.setDrawColor(120);
		doc.setLineWidth(0.5);
		if (sideBrace === 'h-brace') {
			const midY = (bTop + bBottom) / 2;
			doc.line(bLeft, midY, bRight, midY);
		} else if (sideBrace === 'x-brace') {
			doc.line(bLeft, bTop, bRight, bBottom);
			doc.line(bLeft, bBottom, bRight, bTop);
		}
		doc.setDrawColor(40);
		doc.setLineWidth(0.8);
	}

	// Gussets in side view
	if (config.gussets) {
		const sGs = config.gussetSize * scale;
		doc.setFillColor(200, 170, 100);
		// Front leg gusset (inside)
		doc.triangle(
			sideX + sLegH, sideY + sFrameH,
			sideX + sLegH + sGs, sideY + sFrameH,
			sideX + sLegH, sideY + sFrameH + sGs,
			'F'
		);
		// Back leg gusset (inside)
		doc.triangle(
			sideX + sW - sLegH, sideY + sFrameH,
			sideX + sW - sLegH - sGs, sideY + sFrameH,
			sideX + sW - sLegH, sideY + sFrameH + sGs,
			'F'
		);
	}

	// Dimensions — width
	drawDim(doc, sideX, sideY + sH, sideX + sW, sideY + sH, dimLabel(config.width, m), 14, 'h');
	// Dimensions — height
	drawDim(doc, sideX + sW, sideY, sideX + sW, sideY + sH - sFoot, dimLabel(config.height - config.footAllowance, m), 14, 'v');

	y = frontY + sH + 36;

	// --- Top View (plan view, shows Length x Width) ---
	const topX = 60;
	const topY = y;

	doc.setFontSize(8);
	doc.setFont('helvetica', 'bold');
	doc.text('Top', topX + sL / 2, topY - 4, { align: 'center' });

	doc.setDrawColor(40);
	doc.setLineWidth(0.8);
	// Outer frame
	doc.rect(topX, topY, sL, sW);
	// Legs at corners
	doc.rect(topX, topY, sLegW, sLegH);
	doc.rect(topX + sL - sLegW, topY, sLegW, sLegH);
	doc.rect(topX, topY + sW - sLegH, sLegW, sLegH);
	doc.rect(topX + sL - sLegW, topY + sW - sLegH, sLegW, sLegH);

	// Center supports
	if (config.centerSupports > 0) {
		doc.setDrawColor(100);
		doc.setLineWidth(0.4);
		for (let i = 1; i <= config.centerSupports; i++) {
			const cx = topX + sLegW + (sL - sLegW * 2) * i / (config.centerSupports + 1);
			doc.line(cx, topY + sLegH, cx, topY + sW - sLegH);
		}
		doc.setDrawColor(40);
		doc.setLineWidth(0.8);
	}

	// Dimensions
	drawDim(doc, topX, topY + sW, topX + sL, topY + sW, dimLabel(config.length, m), 14, 'h');
	drawDim(doc, topX + sL, topY, topX + sL, topY + sW, dimLabel(config.width, m), 14, 'v');

	return topY + sW + 30;
}

export function exportPDF(
	config: TableConfig,
	items: CutListItem[],
	materials: MaterialsSummary,
	sceneImage: string | null = null
): void {
	const m = config.metric;
	const doc = new jsPDF({ unit: 'pt', format: 'letter' });
	const pageWidth = doc.internal.pageSize.getWidth();
	let y = 50;

	// Title
	doc.setFontSize(18);
	doc.setFont('helvetica', 'bold');
	doc.text('Steel Table — Cut List', 40, y);
	y += 28;

	// Dimensions summary
	const lu = lengthUnit(m);
	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');
	doc.text(
		`Dimensions: ${inToDisplay(config.length, m)} ${lu} L × ${inToDisplay(config.width, m)} ${lu} W × ${inToDisplay(config.height, m)} ${lu} H`,
		40,
		y
	);
	y += 12;

	// Tubing summary
	doc.setFontSize(8);
	doc.setTextColor(80);
	doc.text(`Legs: ${config.legTube.width}" × ${config.legTube.height}" | Frame: ${config.frameTube.width}" × ${config.frameTube.height}" | Brace: ${config.braceTube.width}" × ${config.braceTube.height}"`, 40, y);
	doc.setTextColor(0);
	y += 20;

	// 3D rendered image
	if (sceneImage) {
		const imgWidth = pageWidth - 80;
		const imgHeight = imgWidth * 0.5; // Approximate aspect ratio
		if (y + imgHeight > 700) {
			doc.addPage();
			y = 50;
		}
		doc.addImage(sceneImage, 'PNG', 40, y, imgWidth, imgHeight);
		y += imgHeight + 16;
	}

	// Orthographic views
	if (y + 250 > 750) {
		doc.addPage();
		y = 50;
	}
	y = drawOrthographicViews(doc, config, y);

	// Cut list table — new page if needed
	if (y + 100 > 750) {
		doc.addPage();
		y = 50;
	}

	// Cut list table header
	doc.setFontSize(11);
	doc.setFont('helvetica', 'bold');
	doc.text('Cut List', 40, y);
	y += 18;

	doc.setFontSize(9);
	doc.setFont('helvetica', 'bold');
	const cols = [40, 180, 320, 440];
	const headers = ['Part', 'Profile', `Length (${lu})`, 'Qty'];
	headers.forEach((h, i) => doc.text(h, cols[i], y));
	y += 4;
	doc.setDrawColor(160);
	doc.line(40, y, pageWidth - 40, y);
	y += 14;

	// Cut list rows
	doc.setFont('helvetica', 'normal');
	for (const item of items) {
		if (y > 700) {
			doc.addPage();
			y = 50;
		}
		doc.text(item.description, cols[0], y);
		doc.text(item.tubeLabel, cols[1], y);
		doc.text(inToDisplay(item.length, m), cols[2], y);
		doc.text(String(item.quantity), cols[3], y);
		y += 16;
	}

	y += 16;

	// Materials summary
	if (y > 650) {
		doc.addPage();
		y = 50;
	}

	const llu = lengthLongUnit(m);
	const wu = weightUnit(m);

	doc.setFontSize(12);
	doc.setFont('helvetica', 'bold');
	doc.text('Materials Summary', 40, y);
	y += 20;

	doc.setFontSize(9);
	doc.setFont('helvetica', 'bold');
	const matCols = [40, 180, 280, 380];
	const matHeaders = ['Profile', `Total ${llu}`, `Weight (${wu})`, 'Cost'];
	matHeaders.forEach((h, i) => doc.text(h, matCols[i], y));
	y += 4;
	doc.line(40, y, pageWidth - 40, y);
	y += 14;

	doc.setFont('helvetica', 'normal');
	for (const p of materials.byProfile) {
		doc.text(p.tubeLabel, matCols[0], y);
		doc.text(ftToDisplay(p.totalFeet, m), matCols[1], y);
		doc.text(lbToDisplay(p.weight, m), matCols[2], y);
		doc.text(p.totalCost !== undefined ? '$' + p.totalCost.toFixed(2) : '—', matCols[3], y);
		y += 16;
	}

	y += 12;
	doc.setFont('helvetica', 'bold');
	doc.text(`Total Weight: ${lbToDisplay(materials.totalWeight, m)} ${wu}`, 40, y);
	if (materials.totalCost > 0) {
		y += 16;
		doc.text(`Total Cost: $${materials.totalCost.toFixed(2)}`, 40, y);
	}

	doc.save('tubular-cut-list.pdf');
}
