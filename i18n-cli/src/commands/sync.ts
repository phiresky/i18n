import { namedParam, types } from "@hediet/cli";
import { StaticAnalysis } from "@hediet/i18n-static-analysis";
import ts from "typescript";
import { cmdDef } from "../cli.js";
import { BackendConfig, backendParams } from "../commands-shared.js";
import { FileEditor } from "../FileEditor.js";
import { Translatables } from "../model.js";
import { doExport } from "./export.js";

export const backendSyncCmd = cmdDef({
	name: "backend:sync-src",
	description:
		"Extracts all translatables from the source code and synchronizes them with the backend.",
	namedParams: {
		...backendParams,
		resyncAfterSrcUpdate: namedParam(types.booleanFlag, {
			description:
				"Resynchronizes all translatables after the default text in the source code has been updated. This will let the backend know that all source code updates have been	 comitted.",
		}),
	},
	positionalParams: [],
	getData: (args) => ({
		async run() {
			const config = BackendConfig.from(args);

			console.log(
				`Will upload to ${config.backendUrl}/orgs/${config.backendOrg}/projects/${config.backendProject}/versions/${config.backendVersion}`,
			);

			const client = await config.getAuthenticatedClient();

			const sa = new StaticAnalysis(ts);

			const translatables = new Translatables();
			for (const tsconfig of config.project.tsConfigPaths) {
				console.log(
					`Searching for translatables in "${tsconfig.absolutePath}"`,
				);
				const prog = sa.createProgram(tsconfig.absolutePath);

				const translatablesInProj = sa.findTranslatablesInProg(prog);
				console.log(
					`Found ${translatablesInProj.length} translatables!`,
				);
				for (const elem of translatablesInProj) {
					translatables.addTranslatableSrcElement(elem);
				}
			}

			const translatablesWithPackage = translatables.translatables
				.map((translatable) => ({
					pkg: config.project.getPackage(translatable),
					t: translatable,
				}))
				.filter((t) => t.pkg !== undefined);

			const sync = async () => {
				return await client.versionApi.syncTranslatables({
					version: config.getVersionRef(),
					update: {
						defaultLanguageCode: "en",
						includesAllPackages: true,
						packages: [
							...new Set(
								translatablesWithPackage.map(({ pkg }) => pkg),
							),
						].map((p) => ({
							packageId: p!.packageId,
							includesAllTranslatables: true,
						})),
						translatables: translatablesWithPackage.map(
							({ pkg, t }) => ({
								packageId: pkg!.packageId,
								codeId: t.id,
								description:
									t.description !== undefined
										? t.description
										: null,
								defaultFormat: t.defaultText,
							}),
						),
					},
				});
			};

			console.log("uploading...");
			const result = await sync();
			console.log(JSON.stringify(result, undefined, 4));

			const editor = new FileEditor();
			let hasChanges = false;
			for (const u of result.updatedTranslatables) {
				if (u.defaultFormatUpdate.kind === "shouldUpdateSource") {
					const translatable = translatables.translatables.find(
						(t) => t.id === u.codeId,
					)!;
					for (const srcElem of translatable.srcElements) {
						const file = editor.openFile(srcElem.fileName);
						file.replace(
							srcElem.range.pos,
							srcElem.range.end,
							srcElem.getSource({
								defaultText:
									u.defaultFormatUpdate
										.suggestedDefaultFormat,
							}),
						);
						hasChanges = true;
					}
					console.log("current: ", translatable.defaultText);
					console.log(
						"suggested: ",
						u.defaultFormatUpdate.suggestedDefaultFormat,
					);
					translatable.defaultText =
						u.defaultFormatUpdate.suggestedDefaultFormat;
				}
			}

			if (hasChanges) {
				console.log("applying source updates...");

				editor.applyEdits();
				editor.writeChanges();

				if (args.resyncAfterSrcUpdate) {
					// This tells the service that the code has been updated.
					const result = await sync();
					console.log(JSON.stringify(result, undefined, 4));
				} else {
					console.log(
						"(run synchronize again after you committed the source code update or use the --resyncAfterSrcUpdate flag)",
					);
				}
			}

			console.log("synchronized!");

			const exportConfig = config.project.config.localExport;
			if (exportConfig) {
				console.log(
					`saving current translations to ${exportConfig.path}`,
				);
				await doExport({
					out: exportConfig.path,
					mode: "dir",
					client,
					config,
				});
			}

			process.exit();
		},
	}),
});
