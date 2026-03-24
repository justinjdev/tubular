const IN_TO_MM = 25.4;
const LB_TO_KG = 0.453592;
const FT_TO_M = 0.3048;

export function inToDisplay(inches: number, metric: boolean, decimals = 1): string {
	if (metric) return (inches * IN_TO_MM).toFixed(decimals);
	return inches.toFixed(decimals);
}

export function displayToIn(value: number, metric: boolean): number {
	return metric ? value / IN_TO_MM : value;
}

export function lengthUnit(metric: boolean): string {
	return metric ? 'mm' : 'in';
}

export function ftToDisplay(feet: number, metric: boolean, decimals = 1): string {
	if (metric) return (feet * FT_TO_M).toFixed(decimals);
	return feet.toFixed(decimals);
}

export function lengthLongUnit(metric: boolean): string {
	return metric ? 'm' : 'ft';
}

export function lbToDisplay(lbs: number, metric: boolean, decimals = 1): string {
	if (metric) return (lbs * LB_TO_KG).toFixed(decimals);
	return lbs.toFixed(decimals);
}

export function weightUnit(metric: boolean): string {
	return metric ? 'kg' : 'lbs';
}
