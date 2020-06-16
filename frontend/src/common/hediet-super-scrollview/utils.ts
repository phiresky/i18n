export interface Range {
	start: number;
	length: number;
}

export function rangeIntersects(r1: Range, r2: Range): boolean {
	if (r1.start + r1.length <= r2.start) {
		return false;
	}
	if (r1.start >= r2.start + r2.length) {
		return false;
	}
	return true;
}
