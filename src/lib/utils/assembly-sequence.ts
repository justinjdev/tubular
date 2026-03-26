import type { TableConfig } from '$lib/stores/table.svelte';

export interface AssemblyStep {
	step: number;
	phase: 'Cut' | 'Prep' | 'Tack' | 'Weld' | 'Finish';
	title: string;
	details: string;
	tip?: string; // distortion control or quality tip
}

export function computeAssemblySequence(config: TableConfig): AssemblyStep[] {
	const steps: AssemblyStep[] = [];
	let n = 1;

	// Phase 1: Cutting
	steps.push({
		step: n++,
		phase: 'Cut',
		title: 'Cut all tubing to length',
		details: 'Cut all pieces per the cut list. Label each piece with its part name.',
		tip: 'Cut longest pieces first to maximize stock usage. Deburr all cut ends.'
	});

	// Gusset cutting
	if (Object.values(config.gussets).some(Boolean)) {
		steps.push({
			step: n++,
			phase: 'Cut',
			title: 'Cut gusset plates',
			details: `Cut ${Object.values(config.gussets).filter(Boolean).length * 2} triangular gusset plates from ${config.gussetThickness}" plate.`,
			tip: 'Use a bandsaw or plasma. File edges smooth for better weld penetration.'
		});
	}

	// Phase 2: Prep
	steps.push({
		step: n++,
		phase: 'Prep',
		title: 'Clean and prep all joints',
		details: 'Remove mill scale, oil, and rust from weld zones. Scuff with flap disc or wire wheel.',
		tip: 'Clean at least 1" back from each joint. Contamination causes porosity.'
	});

	// Cope/miter prep if needed
	const joints = config.weldJoints;
	if (joints?.legToFrame === 'cope' || joints?.braceToLeg === 'cope') {
		steps.push({
			step: n++,
			phase: 'Prep',
			title: 'Profile coped joints',
			details: 'Notch coped tube ends using a tube notcher or hole saw. Test-fit before welding.',
			tip: 'Mark cope depth with a scribe line. Grind for tight fit — gaps reduce strength.'
		});
	}
	if (joints?.frameCorners === 'miter') {
		steps.push({
			step: n++,
			phase: 'Prep',
			title: 'Cut frame miters',
			details: 'Cut 45° miters on all frame rail ends. Use a miter fixture or cut-off saw with angle guide.',
			tip: 'Test-fit all four corners before tacking. Miters amplify small angle errors.'
		});
	}

	// Phase 3: Tack frame
	steps.push({
		step: n++,
		phase: 'Tack',
		title: 'Tack the top frame',
		details: 'Lay out the 4 frame rails on a flat surface. Tack all corners. Measure diagonals to verify square.',
		tip: 'Diagonals must match within 1/16". Adjust before full welding. Use a framing square at each corner.'
	});

	// Phase 4: Weld frame
	steps.push({
		step: n++,
		phase: 'Weld',
		title: 'Weld frame corners',
		details: 'Weld all 4 frame corners. Alternate corners (1-3, then 2-4) to minimize distortion.',
		tip: 'Weld in short passes, alternating sides. Let cool between passes to reduce warping.'
	});

	// Phase 5: Tack legs
	steps.push({
		step: n++,
		phase: 'Tack',
		title: 'Tack legs to frame',
		details: 'Flip frame upside down. Set all 4 legs and tack. Verify legs are plumb with a level or square.',
		tip: 'Use magnetic squares or clamps to hold legs at 90°. Check plumb on both axes.'
	});

	// Center support legs
	if (config.centerSupports > 0) {
		steps.push({
			step: n++,
			phase: 'Tack',
			title: `Tack ${config.centerSupports} center support(s)`,
			details: `Set cross members and vertical legs at each center support position. Tack in place.`,
			tip: 'Measure from both ends to ensure even spacing. Tack cross member first, then verticals.'
		});
	}

	// Weld legs
	steps.push({
		step: n++,
		phase: 'Weld',
		title: 'Weld all leg joints',
		details: 'Weld legs to frame. Alternate between legs to distribute heat evenly.',
		tip: 'Weld the joint closest to center of the table first, then work outward.'
	});

	if (config.centerSupports > 0) {
		steps.push({
			step: n++,
			phase: 'Weld',
			title: 'Weld center supports',
			details: 'Weld center cross members and their vertical legs.',
		});
	}

	// Bracing
	const bracedSides = (['front', 'back', 'left', 'right'] as const).filter(s => config.bracing[s] !== 'none');
	if (bracedSides.length > 0) {
		steps.push({
			step: n++,
			phase: 'Tack',
			title: `Tack bracing (${bracedSides.length} side${bracedSides.length > 1 ? 's' : ''})`,
			details: `Fit and tack ${bracedSides.map(s => s).join(', ')} bracing between legs.`,
			tip: 'Flip table to access each side. For X-braces, tack center intersection last.'
		});
		steps.push({
			step: n++,
			phase: 'Weld',
			title: 'Weld bracing',
			details: 'Complete all bracing welds.',
		});
	}

	// Gussets
	if (Object.values(config.gussets).some(Boolean)) {
		steps.push({
			step: n++,
			phase: 'Weld',
			title: 'Weld gussets',
			details: 'Fit and weld gusset plates at leg-to-frame joints.',
			tip: 'Gussets go on last — they stiffen the joint and resist later distortion.'
		});
	}

	// Shelf frame
	if (config.shelfFrame) {
		steps.push({
			step: n++,
			phase: 'Weld',
			title: 'Weld shelf frame',
			details: 'Fit and weld the lower shelf frame rails between legs.',
		});
	}

	// Drawer mounting
	const hasDrawers = config.drawers.some(b => b?.drawers?.length > 0);
	if (hasDrawers) {
		steps.push({
			step: n++,
			phase: 'Weld',
			title: 'Weld drawer slide mounts',
			details: `Weld ${config.drawerSlideMount} slide mounting rails inside each drawer bay.`,
			tip: 'Measure slide positions carefully — drawer fit depends on consistent spacing.'
		});
	}

	// Finishing
	steps.push({
		step: n++,
		phase: 'Finish',
		title: 'Grind and clean welds',
		details: 'Grind splatter, clean all welds. Blend visible joints with flap disc if desired.',
	});

	// Surface finish
	const surfaceFinish = config.surfaceFinish ?? 'raw';
	if (surfaceFinish !== 'raw') {
		const finishLabels: Record<string, string> = {
			'paint': 'Paint',
			'powder-coat': 'Powder coat',
			'galvanized': 'Galvanize (send to shop)',
			'oil-wax': 'Apply oil/wax finish'
		};
		steps.push({
			step: n++,
			phase: 'Finish',
			title: finishLabels[surfaceFinish] ?? 'Apply finish',
			details: surfaceFinish === 'powder-coat'
				? 'Sandblast or acid etch, then send to powder coater. Mask any threaded holes or mounting surfaces.'
				: surfaceFinish === 'galvanized'
				? 'All holes must be vented for hot-dip. Ensure no sealed cavities in tube assemblies.'
				: surfaceFinish === 'paint'
				? 'Prime with self-etching primer, then apply topcoat. Mask any mounting surfaces.'
				: 'Apply penetrating oil or paste wax for a natural steel look. Reapply periodically.',
		});
	}

	// Feet
	if (config.feet.type !== 'none') {
		steps.push({
			step: n++,
			phase: 'Finish',
			title: `Install ${config.feet.type === 'caster' ? 'casters' : 'leveling feet'}`,
			details: `Drill and tap ${config.feet.threadSize} holes in leg bottoms. Thread in ${config.feet.type === 'caster' ? 'casters' : 'leveling feet'}.`,
			tip: 'Drill and tap AFTER welding and finishing. Use cutting fluid for clean threads.'
		});
	}

	// Tabletop
	if (config.tabletop.material !== 'none') {
		steps.push({
			step: n++,
			phase: 'Finish',
			title: 'Mount tabletop',
			details: `Attach ${config.tabletop.material.replace(/-/g, ' ')} top. Drill mounting holes through frame rails.`,
			tip: 'Pre-drill and countersink for flush fasteners. Check for level before final fastening.'
		});
	}

	// Drawers last
	if (hasDrawers) {
		steps.push({
			step: n++,
			phase: 'Finish',
			title: 'Install drawers and slides',
			details: 'Mount drawer slides on rails, then attach drawer boxes. Test operation.',
			tip: 'Install slides before the tabletop if access is tight from above.'
		});
	}

	return steps;
}
