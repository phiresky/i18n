import { namedParam, types } from "@hediet/cli";
import {
	StaticAnalysis,
	TranslatableSrcElement,
} from "@hediet/i18n-static-analysis";
import ts from "typescript";
import { cmdDef } from "../cli.js";
import { FileEditor } from "../FileEditor.js";
import { I18nProject } from "../model.js";
import { groupBy } from "../utils.js";

export const mergeDuplicatesCmd = cmdDef({
	name: "src:merge-duplicates",
	description: "Merges translatables with the same default text.",
	namedParams: {
		project: namedParam(types.string, { shortName: "p" }),
	},
	getData: (args) => ({
		// eslint-disable-next-line @typescript-eslint/require-await
		async run() {
			const p = I18nProject.from(args.project);
			const translatables = new Array<TranslatableSrcElement>();

			for (const tsconfig of p.tsConfigPaths) {
				console.log(
					`Searching for translatables in "${tsconfig.absolutePath}"`,
				);
				const sa = new StaticAnalysis(ts);
				const prog = sa.createProgram(tsconfig.absolutePath);

				const translatablesInProj = sa.findTranslatablesInProg(prog);
				console.log(
					`Found ${translatablesInProj.length} translatables!`,
				);
				translatables.push(...translatablesInProj);
			}

			const editor = new FileEditor();

			const translatablesGroupedByDefaultText = groupBy(
				translatables,
				(t) =>
					JSON.stringify([
						t.defaultText,
						t.description,
						t.parameters,
					]),
			);
			let deletable = 0;
			for (const [key, group] of translatablesGroupedByDefaultText) {
				if (group.length > 1) {
					console.log(`${key} is used ${group.length} times`);
				}
				const newId = group[0].id;

				for (const item of group) {
					const file = editor.openFile(item.fileName);
					file.replace(
						item.range.pos,
						item.range.end,
						item.getSource({ id: newId }),
					);
				}

				deletable += group.length - 1;
			}
			console.log(deletable);

			editor.applyEdits();
			editor.writeChanges();
		},
	}),
});
