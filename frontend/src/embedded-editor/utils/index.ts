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

export const pendingPromise = new Promise<never>(() => {});

export function ref<T, TKey extends keyof T & string>(
	obj: T,
	key: TKey,
): Ref<T[TKey]> {
	return new Ref(
		() => obj[key],
		(v) => (obj[key] = v),
	);
}

export interface IRef<T> {
	get: () => T;
	set: (value: T) => void;
}

class Ref<T> implements IRef<T> {
	constructor(
		public readonly get: () => T,
		public readonly set: (value: T) => void,
	) {}

	public map<TNew>(to: (t: T) => TNew, from: (tNew: TNew) => T): Ref<TNew> {
		return new Ref(
			() => to(this.get()),
			(val) => this.set(from(val)),
		);
	}
}
