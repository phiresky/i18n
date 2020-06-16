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
