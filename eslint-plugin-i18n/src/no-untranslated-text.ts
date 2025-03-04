import { TSESTree } from "@typescript-eslint/utils";
import { createRule, generateId } from "./util.js";

export interface RuleOptions {
	skipElements?: string[];
	skipRegexes?: string[];
}

export type MessageIds = "untranslatedText";

/** Extracts the element name from a JSX element node */
const elementName = (node: TSESTree.Node): string => {
	const reversedIdentifiers: string[] = [];
	if (node.type === TSESTree.AST_NODE_TYPES.JSXElement) {
		let object:
			| TSESTree.JSXTagNameExpression
			| TSESTree.JSXMemberExpression = node.openingElement.name;
		while (object.type === TSESTree.AST_NODE_TYPES.JSXMemberExpression) {
			reversedIdentifiers.push(object.property.name);
			object = object.object;
		}

		if (object.type === TSESTree.AST_NODE_TYPES.JSXIdentifier) {
			reversedIdentifiers.push(object.name);
		}
	}

	return reversedIdentifiers.reverse().join(".");
};

/** Checks if the node has a parent that is in the allowed elements list */
const hasAllowedParent = (
	parent: TSESTree.Node,
	allowedElements: string[],
): boolean => {
	let curNode: TSESTree.Node | undefined = parent;

	while (curNode) {
		if (curNode.type === TSESTree.AST_NODE_TYPES.JSXElement) {
			const name = elementName(curNode);
			if (allowedElements.includes(name)) {
				return true;
			}
		}
		curNode = curNode.parent;
	}

	return false;
};

/** Rule to prevent untranslated text in JSX */
export const noUntranslatedTextRule = createRule<[RuleOptions], MessageIds>({
	name: "no-untranslated-text",
	meta: {
		type: "problem",
		docs: {
			description: "Prevent untranslated text in JSX",
		},
		messages: {
			untranslatedText:
				"{{formattedErrorValue}} is untranslated. All user-visible text must be wrapped in <TransMsg />, transStr(), or <Untranslatable>.",
		},
		fixable: "code",
		schema: [
			{
				type: "object",
				properties: {
					skipElements: {
						type: "array",
						items: {
							type: "string",
						},
					},
					skipRegexes: {
						type: "array",
						items: {
							type: "string",
						},
					},
				},
				additionalProperties: false,
			},
		],
	},
	defaultOptions: [{}],

	create(context, [options]) {
		const report = (node: TSESTree.Node): void => {
			let errorValue: string;

			if (
				node.type === TSESTree.AST_NODE_TYPES.TemplateLiteral &&
				node.expressions[0] &&
				node.expressions[0].type === TSESTree.AST_NODE_TYPES.Identifier
			) {
				errorValue = `TemplateLiteral: ${node.expressions[0].name}`;
			} else if ("value" in node && typeof node.value === "string") {
				errorValue = node.value.trim();
			} else {
				errorValue = "";
			}
			if (
				(options.skipRegexes ?? []).some((r) =>
					new RegExp(r).test(errorValue),
				)
			)
				return;

			const formattedErrorValue =
				errorValue.length > 0
					? `Raw text (${errorValue})`
					: "Whitespace(s)";

			context.report({
				node,
				messageId: "untranslatedText",
				data: {
					formattedErrorValue,
				},
				fix: (fixer) => {
					// Don't fix whitespace
					if (!errorValue.trim()) return null;

					// Handle different node types
					if (node.type === TSESTree.AST_NODE_TYPES.TemplateLiteral) {
						// For template literals, we need to handle expressions
						if (node.expressions.length > 0) {
							// Create a TransMsg with data props for expressions
							const quasis = node.quasis.map((q) => q.value.raw);
							let defaultText = "";
							const dataProps: string[] = [];

							// Build the default text with placeholders
							for (let i = 0; i < quasis.length; i++) {
								defaultText += quasis[i];
								if (i < node.expressions.length) {
									const expr = node.expressions[i];
									const varName = `var${i}`;
									defaultText += `{${varName}}`;

									// Get the source text for the expression
									const exprText = context
										.getSourceCode()
										.getText(expr);
									dataProps.push(`${varName}: ${exprText}`);
								}
							}

							// Escape quotes in the default text
							const escapedText = defaultText.replace(
								/"/g,
								'\\"',
							);

							// Create the TransMsg component with data props
							return fixer.replaceText(
								node.parent,
								`<TransMsg default="${escapedText}" id="${generateId()}" data={{ ${dataProps.join(", ")} }} />`,
							);
						}
					}

					// For simple text nodes and literals
					const textContent = errorValue.trim();

					// Escape quotes in the text content
					const escapedText = textContent.replace(/"/g, '\\"');

					// Create the TransMsg component
					return fixer.replaceText(
						node,
						`<TransMsg default="${escapedText}" id="${generateId()}" />`,
					);
				},
			});
		};

		const allowedElements = options.skipElements ?? [];

		const hasOnlyLineBreak = (value: string): boolean =>
			/^[\r\n\t\f\v]+$/.test(value.replace(/ /g, ""));

		const getValidation = (node: TSESTree.Node): boolean =>
			!node.parent || !hasAllowedParent(node.parent, allowedElements);

		return {
			Literal(node: TSESTree.Literal): void {
				const parentType = node.parent.type;
				const onlyFor = [
					TSESTree.AST_NODE_TYPES.JSXExpressionContainer,
					TSESTree.AST_NODE_TYPES.JSXElement,
				];

				if (
					typeof node.value !== "string" ||
					hasOnlyLineBreak(node.value) ||
					!onlyFor.includes(parentType) ||
					(node.parent.parent &&
						node.parent.parent.type ===
							TSESTree.AST_NODE_TYPES.JSXAttribute)
				)
					return;

				const isStringLiteral =
					parentType ===
					TSESTree.AST_NODE_TYPES.JSXExpressionContainer;
				if (getValidation(isStringLiteral ? node.parent : node)) {
					report(node);
				}
			},

			JSXText(node: TSESTree.JSXText): void {
				if (
					typeof node.value !== "string" ||
					hasOnlyLineBreak(node.value)
				)
					return;
				if (getValidation(node)) {
					report(node);
				}
			},

			TemplateLiteral(node: TSESTree.TemplateLiteral): void {
				if (
					node.parent.type !==
						TSESTree.AST_NODE_TYPES.JSXExpressionContainer ||
					node.parent.parent.type ===
						TSESTree.AST_NODE_TYPES.JSXAttribute
				)
					return;

				if (getValidation(node.parent)) {
					report(node);
				}
			},
		};
	},
});
