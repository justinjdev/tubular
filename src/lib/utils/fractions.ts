/**
 * Convert decimal inches to fractional display string.
 * Rounds to nearest 1/16".
 * Examples: 0.125 -> "1/8", 0.25 -> "1/4", 1.5 -> "1-1/2", 28.0 -> "28", 28.125 -> "28-1/8"
 */
export function toFraction(inches: number): string {
	const negative = inches < 0;
	inches = Math.abs(inches);

	// Round to nearest 1/16
	const sixteenths = Math.round(inches * 16);
	const whole = Math.floor(sixteenths / 16);
	let numerator = sixteenths % 16;

	if (numerator === 0) {
		const result = String(whole || 0);
		return negative ? `-${result}` : result;
	}

	// Reduce fraction
	let denominator = 16;
	while (numerator % 2 === 0) {
		numerator /= 2;
		denominator /= 2;
	}

	const frac = `${numerator}/${denominator}`;
	const result = whole > 0 ? `${whole}-${frac}` : frac;
	return negative ? `-${result}` : result;
}

/**
 * Parse fractional input string to decimal inches.
 * Accepts: "1/2", "1-1/2", "28", "28-1/8", "28.5", "1 1/2"
 * Returns null if unparseable.
 */
export function parseFraction(input: string): number | null {
	const s = input.trim();
	if (!s) return null;

	// Try plain decimal/integer first
	if (/^-?\d+(\.\d+)?$/.test(s)) {
		const v = parseFloat(s);
		return isNaN(v) ? null : v;
	}

	// Match patterns like "1/2", "3/16"
	const fractionOnly = s.match(/^(-?)(\d+)\/(\d+)$/);
	if (fractionOnly) {
		const sign = fractionOnly[1] === '-' ? -1 : 1;
		const num = parseInt(fractionOnly[2], 10);
		const den = parseInt(fractionOnly[3], 10);
		if (den === 0) return null;
		return sign * (num / den);
	}

	// Match patterns like "1-1/2", "28-1/8" or "1 1/2", "28 1/8"
	const mixed = s.match(/^(-?)(\d+)[\s-](\d+)\/(\d+)$/);
	if (mixed) {
		const sign = mixed[1] === '-' ? -1 : 1;
		const whole = parseInt(mixed[2], 10);
		const num = parseInt(mixed[3], 10);
		const den = parseInt(mixed[4], 10);
		if (den === 0) return null;
		return sign * (whole + num / den);
	}

	return null;
}
