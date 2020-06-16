/**
 * Allows using a react component or similar to render data that is sent from
 * server side in a translatable
 */
export interface FormattingInfo<
	KnownGlobalRenderers extends Record<string, any> = Record<string, any>,
> {
	transformer: keyof KnownGlobalRenderers; // interpreted as a key into the data object, usually one that is defined in globalFormatters
	value: KnownGlobalRenderers[keyof KnownGlobalRenderers];
}

export function isFormattingInfo(e: unknown): e is FormattingInfo {
	return typeof e === "object" && !!e && "transformer" in e;
}
