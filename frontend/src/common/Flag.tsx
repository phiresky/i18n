import { Icon } from "@blueprintjs/core";
import { parseRFC5646LanguageTag } from "@hediet/i18n-api";
import * as React from "react";

export function Flag(props: { languageCode: string }) {
	const flagsByLangCodes: Record<string, string | undefined> = {
		en: "gb",
		fr: "fr",
		es: "es",
		fil: "ph",
		hi: "in",
		nl: "nl",
		pl: "pl",
		pt: "pt",
		ru: "ru",
		sr: "rs",
		sv: "se",
		tr: "tr",
		zh: "cn",
		de: "de",
		fi: "fi",
		it: "it",
		ja: "jp",
		ko: "kr",
		id: "id",
	};
	const flagId =
		parseRFC5646LanguageTag(props.languageCode).country ||
		flagsByLangCodes[props.languageCode];
	if (!flagId) {
		return (
			<Icon icon="flag" style={{ width: 24, verticalAlign: "middle" }} />
		);
	}

	return (
		<img
			style={{ width: 24 }}
			src={`https://cdn.jsdelivr.net/npm/flag-icon-css@2.8.0/flags/4x3/${flagId.toLowerCase()}.svg`}
		/>
	);
}
