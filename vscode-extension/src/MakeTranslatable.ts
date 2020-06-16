import { hotClass, registerUpdateReconciler } from "@hediet/node-reload";
import * as ts from "typescript";
import { Range, window, workspace, WorkspaceEdit } from "vscode";
import { TsHelper } from "./TsHelper";

registerUpdateReconciler(module);

function genId(): string {
	const { customAlphabet } = require("nanoid") as {
		customAlphabet: (alphabet: string, size: number) => () => string;
	};
	const alphabet =
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	return customAlphabet(alphabet, 8)();
}

@hotClass(module)
export class MakeTranslatable {
	private readonly helper = new TsHelper();

	public async run() {
		const editor = window.activeTextEditor;
		if (!editor) {
			return;
		}

		const text = editor.document.getText();
		const start = editor.document.offsetAt(editor.selection.start);
		const end = editor.document.offsetAt(editor.selection.end);

		const sf = ts.createSourceFile(
			"index.ts",
			text,
			ts.ScriptTarget.ESNext,
			true,
			ts.ScriptKind.TSX,
		);

		const nodes = this.helper.findNodeRangeThatContains(sf, start, end);

		const refactorings: ((nodes: ts.Node[]) => Refactor | undefined)[] = [
			(nodes) => this.processJsxChild(nodes),
			(nodes) => this.processTemplateString(nodes),
			(nodes) => this.processStr(nodes),
		];

		for (const refactoring of refactorings) {
			const refactor = refactoring(nodes);

			if (refactor) {
				const e = new WorkspaceEdit();
				const start = editor.document.positionAt(refactor.range.start);
				const end = editor.document.positionAt(refactor.range.end);
				e.replace(
					editor.document.uri,
					new Range(start, end),
					refactor.newSrc,
				);

				await workspace.applyEdit(e);
				return;
			}
		}
	}

	processStr(nodes: ts.Node[]): Refactor | undefined {
		if (nodes.length !== 1) {
			return undefined;
		}
		const parts = this.helper.getStringConcatenationParts(nodes[0]);
		if (parts.kind === "node") {
			return undefined;
		}

		const defaultFormat = new Array<DynamicDataKey | string>();
		const data = new DataBag();
		for (const part of parts.parts) {
			if (part.kind === "stringPart") {
				defaultFormat.push(part.text);
			} else {
				defaultFormat.push("{", data.getDataRef(part), "}");
			}
		}

		const dataSrc = !data.hasData ? "" : ` data: ${data.buildDataObj()},`;

		const newSrc = `transStr(${JSON.stringify(
			defaultFormat.map((p) => p.toString()).join(""),
		)}, {${dataSrc} id: "${genId()}"})`;

		return {
			newSrc,
			range: {
				start: nodes[0].getStart(),
				end: nodes[0].getEnd(),
			},
		};
	}

	processTemplateString(nodes: ts.Node[]): Refactor | undefined {
		// e.g. `You have ${i} emails`

		const parentTemplateExpr = nodes.map((n) =>
			this.helper.findParent(ts.isTemplateExpression, n),
		);
		const node = parentTemplateExpr[0];
		if (!node || new Set(parentTemplateExpr).size != 1) {
			return undefined;
		}

		const templateToArr = (template: ts.TemplateLiteral) => {
			if (ts.isTemplateLiteralToken(template)) {
				return [{ kind: "text" as const, text: template.text }];
			}
			const result = new Array<
				| { kind: "expression"; expression: ts.Expression }
				| { kind: "text"; text: string }
			>();

			if (template.head.text !== "") {
				result.push({ kind: "text", text: template.head.text });
			}
			for (const span of template.templateSpans) {
				result.push({
					kind: "expression",
					expression: span.expression,
				});
				result.push({ kind: "text", text: span.literal.text });
			}

			return result;
		};

		const defaultFormat = new Array<string | DynamicDataKey>();
		const data = new DataBag();

		const parts = templateToArr(node);
		for (const p of parts) {
			if (p.kind === "text") {
				defaultFormat.push(p.text);
			} else {
				defaultFormat.push("{", data.getDataRef(p.expression), "}");
			}
		}

		const dataSrc = !data.hasData ? "" : ` data: ${data.buildDataObj()},`;

		const newSrc = `transStr(${JSON.stringify(
			defaultFormat.map((c) => c.toString()).join(""),
		)}, {${dataSrc} id: "${genId()}"})`;

		return {
			newSrc,
			range: {
				start: node.getStart(),
				end: node.getEnd(),
			},
		};
	}

	/** @param nodes Are adjacent. */
	processJsxChild(nodes: ts.Node[]): Refactor | undefined {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		if (!nodes.every((n) => (ts as any).isJsxChild(n))) {
			return;
		}

		const jsxChildren = nodes as ts.JsxChild[];

		let hasError = false;

		function capitalize(str: string): string {
			return str[0].toUpperCase() + str.substr(1);
		}

		const data = new DataBag();

		const processNode = (
			node: ts.JsxChild,
		): (string | DynamicDataKey)[] => {
			if (ts.isJsxText(node)) {
				const lines = node.text.split("\n");
				const trimmed = lines.map((line, idx) => {
					if (idx === 0 && lines.length === 1) {
						return line;
					}
					if (idx === 0) {
						return line.trimRight();
					}
					if (idx === lines.length - 1) {
						return line.trimLeft();
					}
					return line.trim();
				});
				return [trimmed.filter((l) => l !== "").join(" ")];
			} else if (ts.isJsxExpression(node)) {
				if (node.expression) {
					const exprVal = this.parseString(node.expression);
					if (exprVal) {
						return [exprVal];
					}
					return ["{", data.getDataRef(node.expression), "}"];
				}
				hasError = true;
				return [""];
			} else if (ts.isJsxElement(node)) {
				return processJsxElement(node);
			} else if (ts.isJsxSelfClosingElement(node)) {
				return [
					`{`,
					data.getDataRef(
						node.getText(),
						capitalize(node.tagName.getText()),
					),
					`}`,
				];
			} else {
				// debugger;
				return ["unsupported"];
			}
		};

		const processJsxElement = (
			node: ts.JsxElement,
		): (string | DynamicDataKey)[] => {
			const result = new Array<string | DynamicDataKey>();
			for (const c of node.children) {
				result.push(...processNode(c));
			}

			const clone = ts.factory.createJsxElement(
				node.openingElement,
				ts.factory.createNodeArray([
					ts.factory.createJsxExpression(
						undefined,
						ts.factory.createIdentifier("body"),
					),
				]),
				node.closingElement,
			);
			const body = ts
				.createPrinter()
				.printNode(ts.EmitHint.Expression, clone, node.getSourceFile());

			return [
				`{`,
				data.getDataRef(
					`body => (${body})`,
					capitalize(node.openingElement.tagName.getText()),
				),
				` <`,
				...result,
				`>}`,
			];
		};

		const defaultText = jsxChildren
			.map((node) =>
				processNode(node)
					.map((val) => val.toString())
					.join(""),
			)
			.join("");

		if (hasError) {
			// debugger;
			return undefined;
		}

		const dataSrc = !data.hasData ? "" : ` data={${data.buildDataObj()}}`;
		const newSrc = `<TransMsg default={${JSON.stringify(
			defaultText,
		)}}${dataSrc} id="${genId()}" />`;

		return {
			newSrc,
			range: {
				start: nodes[0].getStart(),
				end: nodes[nodes.length - 1].getEnd(),
			},
		};
	}

	parseString(expr: ts.Expression): string | undefined {
		if (!ts.isStringLiteral(expr)) {
			return undefined;
		}
		return expr.text;
	}
}

class DataBag {
	private readonly entries = new Array<DataEntry>();

	public getDataRef(
		expr: ts.Node | string,
		suggestedKey?: string,
	): DynamicDataKey {
		const src = typeof expr === "string" ? expr : expr.getText();

		const existing = this.entries.find(
			(e) => e.exprSrc.trim() === src.trim(),
		);
		if (existing) {
			return existing.keyRef;
		} else {
			let key = suggestedKey;
			if (typeof expr === "string") {
				if (!key) {
					key = "expr";
				}
			} else {
				key = this.getSuggestedName(expr);
			}

			let idx = 1;
			const getUniqueKey = () =>
				String(key) + (idx === 1 ? "" : `${idx}`);
			while (true) {
				const existing = this.entries.find(
					(k) => k.key === getUniqueKey(),
				);
				if (!existing) {
					break;
				}
				if (existing.isUnique) {
					existing.key = existing.key + "1";
					existing.isUnique = false;
				}
				idx++;
			}

			const entry: DataEntry = {
				exprSrc: src,
				isUnique: idx === 1,
				key,
				keyRef: {
					get key() {
						return entry.key;
					},
					toString: () => entry.key,
				},
			};
			entry.key = getUniqueKey();
			this.entries.push(entry);

			return entry.keyRef;
		}
	}

	private getSuggestedName(expr: ts.Node): string {
		if (ts.isIdentifier(expr)) {
			return expr.text.trim();
		} else if (ts.isJsxOpeningLikeElement(expr)) {
			return expr.tagName.getText();
		}
		return "expr";
	}

	public get hasData(): boolean {
		return this.entries.length !== 0;
	}

	public buildDataObj(): string {
		return `{ ${this.entries
			.map((e) =>
				e.key.trim() == e.exprSrc.trim()
					? `${e.key}`
					: `${e.key}: ${e.exprSrc}`,
			)
			.join(", ")} }`;
	}
}

interface DataEntry {
	exprSrc: string;
	key: string;
	isUnique: boolean;
	keyRef: DynamicDataKey;
}

interface DynamicDataKey {
	key: string;
	toString(): string;
}

interface Refactor {
	range: { start: number; end: number };
	newSrc: string;
}
