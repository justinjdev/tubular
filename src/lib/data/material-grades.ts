export interface GradeInfo {
	grade: string;
	name: string;
	description: string;
	weldability: string;
	fillerWire: string;
	notes: string;
}

export const MATERIAL_GRADES: GradeInfo[] = [
	{
		grade: 'A500',
		name: 'ASTM A500',
		description: 'Cold-formed structural tubing',
		weldability: 'Good — preheat not required for most gauges',
		fillerWire: 'ER70S-6 (MIG) or E7018 (stick)',
		notes: 'Most common for structural tubing. Grade B/C typical.'
	},
	{
		grade: 'A513',
		name: 'ASTM A513',
		description: 'Electric-resistance-welded tubing',
		weldability: 'Good — clean seam before welding across ERW weld',
		fillerWire: 'ER70S-6 (MIG) or E7018 (stick)',
		notes: 'Mechanical tubing, tighter tolerances than A500. Common in DOM.'
	},
	{
		grade: 'A36',
		name: 'ASTM A36',
		description: 'Hot-rolled structural steel',
		weldability: 'Excellent — most forgiving to weld',
		fillerWire: 'ER70S-6 (MIG) or E7018 (stick)',
		notes: 'Used for flat bar, plate, and angle. Not available as tube.'
	},
	{
		grade: 'DOM',
		name: 'DOM (Drawn Over Mandrel)',
		description: 'Seamless mechanical tubing',
		weldability: 'Good — uniform wall, no seam issues',
		fillerWire: 'ER70S-6 (MIG)',
		notes: 'Premium tubing. Consistent wall thickness, higher cost. Round tube only.'
	},
];
