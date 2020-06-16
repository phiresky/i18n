import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";
import importSync from "import-sync";
const createRule = ESLintUtils.RuleCreator((_ruleName) => "");

function __type() {
	return import("@hediet/i18n-static-analysis");
}
type StaticAnalysis = Awaited<ReturnType<typeof __type>>["StaticAnalysis"];

const i18nRule = createRule({
	name: "check-translatables",
	meta: {
		docs: {
			description: "Check translatables",
			// category: "Possible Errors",
			recommended: "recommended",
			requiresTypeChecking: false,
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
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- hack bc of async
		let StaticAnalysis: StaticAnalysis = importSync(
			"@hediet/i18n-static-analysis",
		).StaticAnalysis;
		const parserServices = context.parserServices!;
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

export const rules = {
	"check-translatables": i18nRule,
};
