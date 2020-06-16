import { contract, requestType } from "@hediet/json-rpc";
import * as s from "@hediet/semantic-json";
import {
	sVersionInfo,
	sVersionRef,
	sTranslatablesWithTranslations,
	sTranslatablesUpdate,
	sTranslationsForLanguageCode,
	sVersionExport,
	sTranslatablesSyncResult,
} from "./types";

export const versionContract = contract({
	name: "version",
	client: {},
	server: {
		/* def */ getVersions: requestType({
			params: s.sObject({
				orgId: s.sString(),
				projectId: s.sString(),
			}),
			result: s.sOpenObject({
				versions: s.sArrayOf(sVersionInfo),
			}),
		}),
		/* def */ exportVersion: requestType({
			params: s.sObject({
				version: sVersionRef,
			}),
			result: s.sOpenObject({
				export: sVersionExport,
			}),
		}),
		/* def */ importVersion: requestType({
			params: s.sObject({
				version: sVersionRef,
				import: sVersionExport,
			}),
		}),
		/* def */ getTranslatablesWithTranslations: requestType({
			params: s.sObject({
				version: sVersionRef,
			}),
			result: sTranslatablesWithTranslations,
		}),
		/* def */ postTranslation: requestType({
			params: s.sObject({
				version: sVersionRef,
				translatableId: s.sNumber(),
				languageCode: s.sString(),
				translatedFormat: s.sUnion([s.sString(), s.sNull()]),
			}),
		}),
		/* def */ syncTranslatables: requestType({
			params: s.sObject({
				version: sVersionRef,
				update: sTranslatablesUpdate,
			}),
			result: sTranslatablesSyncResult,
		}),
		/* def */ getTranslationsForLanguageCode: requestType({
			params: s.sObject({
				version: sVersionRef,
				languageCode: s.sString(),
				requestedPackageIds: s.prop(s.sArrayOf(s.sString()), {
					optional: true,
				}),
			}),
			result: sTranslationsForLanguageCode,
		}),
		/* def */ getVersionInfo: requestType({
			params: s.sObject({
				version: sVersionRef,
			}),
			result: s.sOpenObject({
				defaultLanguageCode: s.sUnion([s.sString(), s.sNull()]),
				locked: s.sBoolean(),
				languages: s.sArrayOf(
					s.sOpenObject({
						languageCode: s.sString(),
						name: s.sString(),
						published: s.sBoolean(),
						translatedWords: s.sNumber(),
						/** Between 0 and 100 */
						translatedPercent: s.sNumber(),
					}),
				),
			}),
		}),
		/* def */ deleteLanguage: requestType({
			params: s.sObject({
				version: sVersionRef,
				languageCode: s.sString(),
			}),
		}),
		/* def */ postLanguage: requestType({
			params: s.sObject({
				version: sVersionRef,
				languageCode: s.sString(),
				languageName: s.sString(),
			}),
		}),
		/* def */ updateVersion: requestType({
			params: s.sObject({
				version: sVersionRef,
				defaultLanguageCode: s.prop(s.sString(), {
					optional: true,
				}),
				locked: s.prop(s.sBoolean(), {
					optional: true,
				}),
			}),
		}),
		/* def */ updateLanguage: requestType({
			params: s.sObject({
				version: sVersionRef,
				languageCode: s.sString(),
				details: s.sObject({
					published: s.prop(s.sBoolean(), {
						optional: true,
					}),
					name: s.prop(s.sString(), {
						optional: true,
					}),
				}),
			}),
		}),
	},
});
