export function failAfterTimeout<T>(
	ms: number,
	promise: Promise<T>,
): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_resolve, reject) => {
			setTimeout(() => {
				reject(new Error("timeout"));
			}, ms);
		}),
	]);
}

export function getOrInitialize<TKey, TValue>(
	map: Map<TKey, TValue>,
	key: TKey,
	initialize: () => TValue,
): TValue {
	let r = map.get(key);
	if (!r) {
		r = initialize();
		map.set(key, r);
	}
	return r;
}

export function tryMapAndReturnFirst<TIn, TOut>(
	items: ReadonlyArray<TIn>,
	map: (item: TIn) => TOut,
): TOut | undefined {
	for (const item of items) {
		try {
			return map(item);
		} catch (e: any) {
			console.error(
				"An error happened while trying out '",
				item,
				"':",
				e,
			);
		}
	}
	return undefined;
}
