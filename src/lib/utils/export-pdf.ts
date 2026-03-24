import { jsPDF } from 'jspdf';
import type { TableConfig } from '$lib/stores/table.svelte';
import type { CutListItem } from './cut-list';
import type { MaterialsSummary } from './materials';
import { inToDisplay, lengthUnit, ftToDisplay, lengthLongUnit, lbToDisplay, weightUnit } from './units';

export function exportPDF(
	config: TableConfig,
	items: CutListItem[],
	materials: MaterialsSummary
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
	y += 24;

	// Cut list table header
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
