//import { semanticJson as s } from "@hediet/json-rpc";
import * as s from "@hediet/semantic-json";

export const sOrgOverview = s.sObject({
	orgId: s.sString(),
	isAdmin: s.sBoolean(),
	projects: s.sArrayOf(
		s.sObject({
			projectId: s.sString(),
		}),
	),
});

export const sVersionInfo = s.sOpenObject({
	name: s.sString(),
	iteration: s.sNumber(),
	id: s.sString(),
	locked: s.sBoolean(),
});

export const sTranslatablesUpdate = s.sObject({
	defaultLanguageCode: s.sString(),
	includesAllPackages: s.sBoolean(),
	packages: s.sArrayOf(
		s.sObject({
			packageId: s.sString(),
			includesAllTranslatables: s.sBoolean(),
		}),
	),
	translatables: s.sArrayOf(
		s.sObject({
			packageId: s.sString(),
			codeId: s.sString(),
			defaultFormat: s.sString(),
			description: s.sUnion([s.sString(), s.sNull()]),
		}),
	),
});

export const sTranslatablesSyncResult = s.sObject({
	addedTranslatables: s.sArrayOf(
		s.sObject({
			codeId: s.sString(),
			wasStale: s.sBoolean(),
		}),
	),
	removedTranslatables: s.sArrayOf(
		s.sObject({
			codeId: s.sString(),
		}),
	),
	updatedTranslatables: s.sArrayOf(
		s.sObject({
			codeId: s.sString(),
			defaultFormatUpdate: s.sUnion([
				s.sObject({
					kind: s.sLiteral("none"),
				}),
				s.sObject({
					kind: s.sLiteral("shouldUpdateSource"),
					suggestedDefaultFormat: s.sString(),
				}),
				s.sObject({
					kind: s.sLiteral("didUpdateDefaultLanguage"),
					oldTranslatedFormat: s.sUnion([s.sString(), s.sNull()]),
					newTranslatedFormat: s.sString(),
				}),
			]),
		}),
	),
});

export const sTranslatablesWithTranslations = s.sObject({
	defaultLanguageCode: s.sString(),
	includesAllPackages: s.sBoolean(),
	languages: s.sArrayOf(s.sObject({ languageCode: s.sString() })),
	packages: s.sArrayOf(
		s.sObject({
			packageId: s.sString(),
			includesAllTranslatables: s.sBoolean(),
		}),
	),
	translatables: s.sArrayOf(
		s.sObject({
			codeId: s.sString(),
			packageId: s.sString(),
			description: s.sUnion([s.sString(), s.sNull()]),
			translatableId: s.sNumber(),
			translations: s.sArrayOf(
				s.sObject({
					languageCode: s.sString(),
					translatedFormat: s.sUnion([s.sString(), s.sNull()]),
				}),
			),
			//origin: s.sObject({}, { allowUnknownProperties: true }),
		}),
	),
});

export const sTranslationsForLanguageCode = s.sObject({
	languageCode: s.sString(),
	/** If not partial, all packages are included */
	includesAllPackages: s.sBoolean(),
	packagesById: s.sMap(
		s.sObject({
			includesAllTranslatables: s.sBoolean(),
			translationsByCodeId: s.sMap(
				s.sObject({
					translatedFormat: s.sString(), // might fall back to default language
					isUntranslatedInRequestedLanguage: s.sBoolean(),
					//origin: s.sObject({}, { allowUnknownProperties: true }),
				}),
			),
		}),
	),
});

export const sVersionRef = s.sObject({
	orgId: s.sString(),
	projectId: s.sString(),
	versionId: s.sString(),
});

export type VersionRef = (typeof sVersionRef)["T"];

export const sVersionExport = s.sObject({
	languages: s.sArrayOf(
		s.sObject({
			languageCode: s.sString(),
			name: s.sString(),
		}),
	),
	defaultLanguageCode: s.sString(),
	translatables: s.sArrayOf(
		s.sObject({
			codeId: s.sString(),
			packageId: s.sString(),
			description: s.sUnion([s.sString(), s.sNull()]),
			translations: s.sArrayOf(
				s.sObject({
					languageCode: s.sString(),
					translatedFormat: s.sUnion([s.sString(), s.sNull()]),
				}),
			),
		}),
	),
});

export type VersionExport = (typeof sVersionExport)["T"];
