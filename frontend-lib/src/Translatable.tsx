/**
 * This file is also imported in the client, so don't include any server side
 * packages
 */

import { FormattingInfo } from "./formatting";

/**
 * Describes a message that might be translatable. Can be serialized and
 * translated at the client.
 */
export interface Translatable<TData = TranslatableI18nData> {
	defaultTranslation: string;
	data?: TData;
	/** Must be set if this format is translatable. */
	id?: string;
	debugData?: string;
}

export type TranslatableI18nValue =
	| undefined
	| null
	| string
	| number
	| Translatable
	| FormattingInfo;
export type TranslatableI18nData = Record<string, TranslatableI18nValue>;

/**
 * Creates a message that can be translated on the client (also known as a lazy
 * translation).
 */
export function translatable(
	defaultTranslation: string,
	options: {
		data?: TranslatableI18nData;
		/**
		 * A static description of this translatable for the translator. Is not
		 * used at runtime. Only set a description if `default` needs more
		 * context.
		 */
		description?: string;
		/** The static id of this translatable. */
		id: string;
		/**
		 * An optional static debug information to be passed on to client. Not
		 * used while rendering but can be seen from the received translatable
		 * message content (from socket, HTTP response etc.)
		 */
		debugData?: string;
	},
): Translatable {
	return {
		defaultTranslation,
		data: options.data,
		id: options.id,
		debugData: options.debugData,
	};
}

type Untranslated = Translatable;
/**
 * Use this if you don't want to make a string translatable. Use it for all
 * admin interactions, and errors that don't or almost never appear for normal
 * users (e.g. in case of race condition between multiple clients or when user
 * tries to abuse our APIs)
 *
 * This is preferred over Translatable|string since it forces the dev to
 * actively decide to not make the text translatable.
 */
export function staticText(text: string): Untranslated {
	return {
		defaultTranslation: "{text}",
		data: {
			text,
		},
	};
}

export function isTranslatable(
	x: unknown | string | Translatable | React.ComponentType,
): x is Translatable {
	return !!x && typeof (x as Translatable).defaultTranslation === "string";
}

const THINSPACE = "\u202f";
export function currencyToString(
	value: number,
	explicitPlus = false,
	nobreak = false,
): string {
	value = parseFloat((Math.round(value * 100) / 100).toFixed(2));
	const str =
		Math.abs(value) >= 10000
			? value
					.toLocaleString("en-US")
					.replace(/,/g, nobreak ? "\u00A0" : " ")
			: String(value);
	if (explicitPlus && value >= 0) return "+" + str;
	return str;
}
export function spacedOutNumbers(
	number: number,
	explicitPlus = false,
	nobreak = false,
): string {
	number = Math.round(number);
	const str =
		Math.abs(number) >= 10000
			? number
					.toLocaleString("en-US")
					.replace(/,/g, nobreak ? "\u00A0" : " ")
			: String(number);
	if (explicitPlus && number >= 0) return "+" + str;
	return str;
}

export function createLocalizedNumberString(
	amount: number,
	options?: Intl.NumberFormatOptions,
): string {
	const str = amount
		.toLocaleString("en-US", options)
		.replace(/,/g, Math.abs(amount) >= 10000 ? THINSPACE : "");
	return str;
}
export function parseLocalizedNumberString(amount: string): number {
	return +amount.replace(/[^0-9.]/g, "");
}

// for errors that are used in multiple places
export const MESSAGES = {
	NOT_STEAM_ACCOUNT: "Not a Steam account",
};
