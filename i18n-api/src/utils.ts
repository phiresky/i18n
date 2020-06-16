export function parseRFC5646LanguageTag(tag: string): {
	language: string;
	country?: string;
} {
	// kinda incomplete i guess. maybe use library
	const [language, country] = tag.split("-");
	return { language, country };
}

export function getBestFittingLanguage(info: {
	supportedLanguageCodes: readonly string[];
	acceptedLanguageCodes: readonly string[];
	fallbackLanguageCode: string | null;
}): string | null {
	// todo: don't ignore country tag
	const supportedLanguages = new Set(
		info.supportedLanguageCodes.map(
			(c) => parseRFC5646LanguageTag(c).language,
		),
	);
	const acceptedLanguageCodes = info.acceptedLanguageCodes.map(
		(c) => parseRFC5646LanguageTag(c).language,
	);
	return (
		acceptedLanguageCodes.find((acceptedLang) =>
			supportedLanguages.has(acceptedLang),
		) ?? info.fallbackLanguageCode
	);
}
