import { toObject } from "./other.js";

export type DiffTuple<T1, T2> = { key: string; val1: T1; val2: T2 };
export type KeyDiff<T1, T2> =
	| DiffTuple<T1, T2>
	| DiffTuple<T1, undefined>
	| DiffTuple<undefined, T2>;

export function diffBy<T1, T2>(
	items1: ReadonlyArray<T1>,
	items2: ReadonlyArray<T2>,
	keySelector: (item: T1 | T2) => string,
): KeyDiff<T1, T2>[] {
	const obj1 = toObject(items1, keySelector);
	const obj2 = toObject(items2, keySelector);
	return diffObjectKeys(obj1, obj2);
}

export function diffObjectKeys<T1, T2>(
	obj1: Record<string, T1>,
	obj2: Record<string, T2>,
): KeyDiff<T1, T2>[] {
	const result = new Array<KeyDiff<T1, T2>>();
	for (const key in obj1) {
		if (key in obj2) {
			result.push({
				key,
				val1: obj1[key],
				val2: obj2[key],
			});
		} else {
			result.push({ key, val1: obj1[key], val2: undefined });
		}
	}
	for (const key in obj2) {
		if (!(key in obj1)) {
			result.push({ key, val1: undefined, val2: obj2[key] });
		}
	}

	return result;
}
