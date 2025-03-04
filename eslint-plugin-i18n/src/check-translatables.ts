import { TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";
import { createRule } from "./util.js";
import { StaticAnalysis } from "@hediet/i18n-static-analysis";
import { getParserServices } from "@typescript-eslint/utils/eslint-utils";

export const checkTranslatablesRule = createRule({
	name: "check-translatables",
	meta: {
		docs: {
			description: "Check translatables",
		},
		messages: {
			await: "Invalid translatable: {{ message }}",
		},
		schema: [],
		type: "problem",
		fixable: "code",
	},
	defaultOptions: [],

	create(context) {
		const parserServices = getParserServices(context, true);
		const analyzer = new StaticAnalysis(ts);

		function processNode(node: TSESTree.Node) {
			const originalNode = parserServices.esTreeNodeToTSNodeMap.get(node);
			const translatable = analyzer.findTranslatableAt(originalNode);

			if (!translatable) {
				return;
			}

			for (const e of translatable.errors) {
				let n = node;
				if (e.node) {
					n = parserServices.tsNodeToESTreeNodeMap.get(e.node);
				}
				context.report({
					messageId: "await",
					data: {
						message: e.message,
					},
					node: n,
					fix:
						"getFixedSource" in e
							? (fixer) =>
									fixer.replaceText(node, e.getFixedSource!())
							: undefined,
				});
			}
		}

		return {
			CallExpression(node): void {
				processNode(node);
			},
			JSXOpeningElement(node): void {
				processNode(node);
			},
		};
	},
});
