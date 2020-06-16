import { cmdDef } from "../cli.js";
import { backendParams, BackendConfig } from "../commands-shared.js";
import { writeFileSync } from "fs";
import { namedParam, types } from "@hediet/cli";
import * as path from "node:path";
import { Translations, LocalJsonMeta } from "@hediet/i18n-frontend-lib";
import { I18nConnection } from "@hediet/i18n-api";

export async function doExport(args: {
	out: string;
	mode: "file" | "dir";
	client: I18nConnection;
	config: BackendConfig;
}) {
	const data = await args.client.versionApi.exportVersion({
		version: args.config.getVersionRef(),
	});

	const exportedData = data.export;
	if (args.mode === "file") {
		writeFileSync(args.out, JSON.stringify(exportedData, undefined, 4));
	} else if (args.mode === "dir") {
		const meta: LocalJsonMeta = {
			supportedLanguages: exportedData.languages,
			defaultLanguage: {
				languageCode: exportedData.defaultLanguageCode,
			},
		};
		writeFileSync(
			path.join(args.out, "meta.json"),
			JSON.stringify(meta, undefined, 4),
		);
		const t: Record<string, Translations> = {};
		// convert to multi-json format
		for (const e of exportedData.translatables) {
			for (const lang of exportedData.languages) {
				const tgtLang =
					t[lang.languageCode] ??
					(t[lang.languageCode] = {
						languageCode: lang.languageCode,
						packagesById: {},
					});

				const tgtPackage =
					tgtLang.packagesById[e.packageId] ??
					(tgtLang.packagesById[e.packageId] = {
						translationsByCodeId: {},
					});

				let translation = e.translations.find(
					(tr) => tr.languageCode === lang.languageCode,
				);
				if (!translation || !translation.translatedFormat) {
					translation = e.translations.find(
						(tr) =>
							tr.languageCode ===
							exportedData.defaultLanguageCode,
					);
					if (!translation || !translation.translatedFormat)
						throw Error(`no default found for id ${e.codeId}`);
				}
				tgtPackage.translationsByCodeId[e.codeId] = {
					isUntranslatedInRequestedLanguage:
						translation.languageCode !== lang.languageCode,
					translatedFormat: translation.translatedFormat,
				};
			}
		}
		for (const lang in t) {
			writeFileSync(
				path.join(args.out, `translations.${lang}.json`),
				JSON.stringify(t[lang], undefined, 4),
			);
		}
	}
}
export const exportCmd = cmdDef({
	name: "backend:export",
	description: "Exports a version.",
	namedParams: {
		...backendParams,
		out: namedParam(types.string, {}),
		mode: namedParam(types.choice("file", "dir"), {}),
	},
	getData: (args) => ({
		async run() {
			const config = BackendConfig.from(args);
			const client = await config.getAuthenticatedClient();

			await doExport({ out: args.out, mode: args.mode, client, config });
			process.exit(0);
		},
	}),
});
