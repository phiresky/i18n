/*
 * This file is licensed under MIT.
 */

export interface EmbeddedTranslationEditorSocket {
	set(translations: LocaleTranslations | undefined): void;
	initialized(): void;
	close(): void;
}

export interface Translatable {
	codeId: string;
	defaultFormat: string;
}

export interface LocaleTranslations {
	languageCode: string;
	translations: Translation[];
	translateUnknown(translatable: Translatable): Translation | undefined;
}

export interface Translation {
	codeId: string;
	translatedFormat: string;
}

interface GlobalExtension {
	$embeddedTranslationEditorSocket:
		| EmbeddedTranslationEditorSocket
		| undefined;
}

export declare function setEmbeddedTranslationEditorSocket(
	socket: EmbeddedTranslationEditorSocket,
): void;

export declare function getEmbeddedTranslationEditorSocket():
	| EmbeddedTranslationEditorSocket
	| undefined;
