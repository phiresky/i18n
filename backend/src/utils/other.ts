export function flatMap<T, TResult>(
	arr: T[],
	selector: (item: T, idx: number) => readonly TResult[],
): TResult[] {
	return new Array<TResult>().concat(
		...arr.map((item, idx) => selector(item, idx)),
	);
}

export function groupBy<T, TKey>(
	items: ReadonlyArray<T>,
	keySelector: (item: T) => TKey,
): Map<TKey, T[]> {
	const map = new Map<TKey, T[]>();
	for (const item of items) {
		const key = keySelector(item);
		let items = map.get(key);
		if (!items) {
			items = [];
			map.set(key, items);
		}
		items.push(item);
	}
	return map;
}

export function toObject<TItem, TKey extends string | number>(
	items: ReadonlyArray<TItem>,
	keySelector: (item: TItem) => TKey,
): Record<TKey, TItem>;
export function toObject<TItem, TKey extends string | number, TNewValue>(
	items: ReadonlyArray<TItem>,
	keySelector: (item: TItem) => TKey,
	valueSelector: (item: TItem) => TNewValue,
): Record<TKey, TItem>;
export function toObject<TItem, TKey extends string, TValue>(
	items: ReadonlyArray<TItem>,
	keySelector: (item: TItem) => TKey,
	valueSelector?: (item: TItem) => TValue,
): any {
	const o = {} as Record<TKey, any>;
	for (const i of items) {
		o[keySelector(i)] = valueSelector ? valueSelector(i) : i;
	}
	return o;
}

export function countWords(str: string): number {
	return str.trim().split(/\s+/).length;
}
