import { Pattern, PatternFactory } from "@hediet/ts-api-extras";
import { customAlphabet } from "nanoid";
import tsApi from "typescript";
import { TsHelper } from "./ts-utils/helper.js";

export interface TranslatableSrcElement {
	defaultText: string;
	id: string | undefined;
	parameters: Record<string, TranslatableParameterInfo>;
	description: string | undefined;

	fileName: string;
	range: { pos: number; end: number };
	getSource(args: { defaultText?: string; id?: string }): string;
	errors: SrcError[];
}

export type TranslatableParameterInfo =
	| {
			kind: "content";
	  }
	| {
			kind: "number";
	  }
	| {
			kind: "markup";
	  };

export interface SrcError {
	node?: tsApi.Node;
	message: string;
	getFixedSource?: () => string;
}

export class StaticAnalysis {
	private readonly Pattern: ReturnType<typeof PatternFactory>;
	private readonly tsHelper: TsHelper;
	private readonly generateId = customAlphabet(
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
		8,
	);

	public constructor(private readonly ts: typeof tsApi) {
		this.Pattern = PatternFactory(this.ts);
		this.tsHelper = new TsHelper(this.ts);
		this.pattern = this.Pattern.node(this.ts.SyntaxKind.CallExpression, {
			expression: this.Pattern.identifier("translatable").or(
				this.Pattern.identifier("transStr"),
			),
		})
			.mustBe<tsApi.CallExpression>()
			.or(
				this.Pattern.node(this.ts.SyntaxKind.JsxSelfClosingElement, {
					tagName: this.Pattern.identifier("TransMsg"),
				}).mustBe<tsApi.JsxSelfClosingElement>(),
			);
	}

	public createProgram(configPath: string): tsApi.Program {
		return this.tsHelper.createProgram(configPath);
	}

	public findTranslatablesInProg(
		prog: tsApi.Program,
	): TranslatableSrcElement[] {
		const result = new Array<TranslatableSrcElement>();

		for (const sf of prog.getSourceFiles()) {
			result.push(...this.findTranslatablesInSf(sf));
		}

		return result;
	}

	private readonly pattern: Pattern<
		tsApi.Node,
		tsApi.CallExpression | tsApi.JsxSelfClosingElement,
		Record<never, unknown>
	>;

	public findTranslatablesInSf(
		sf: tsApi.SourceFile,
	): TranslatableSrcElement[] {
		const result = new Array<TranslatableSrcElement>();

		/*
		if (sf.getText().indexOf("TransMsg") === -1) {
			return [];
		}*/

		const matches = this.pattern.findAllMatches(sf);

		for (const m of matches) {
			const translatable = this.processMatch(m.matchedValue);
			if (translatable) {
				result.push(translatable);
			}
		}

		return result;
	}

	public findTranslatableAt(
		node: tsApi.Node,
	): TranslatableSrcElement | undefined {
		const m = this.pattern.match(node);
		if (!m) {
			return undefined;
		}
		return this.processMatch(m.matchedValue);
	}

	private processMatch(node: tsApi.Node) {
		if (this.ts.isCallExpression(node)) {
			return this.processTranslatableCall(node);
		} else if (this.ts.isJsxSelfClosingElement(node)) {
			return this.processJsxElement(node);
		}
		return undefined;
	}

	private processJsxElement(
		elem: tsApi.JsxSelfClosingElement,
	): TranslatableSrcElement {
		// TODO what about non-self closing?

		let defaultText:
			| { value: string; node: tsApi.StringLiteral | tsApi.JsxExpression }
			| "unset"
			| "invalid" = "unset";
		let description:
			| { value: string; node: tsApi.StringLiteral | tsApi.JsxExpression }
			| "unset"
			| "invalid" = "unset";
		let id:
			| { value: string; node: tsApi.StringLiteral | tsApi.JsxExpression }
			| "unset"
			| "invalid" = "unset";
		const errors = new Array<SrcError>();

		for (const prop of elem.attributes.properties) {
			if (
				!this.ts.isJsxAttribute(prop) ||
				!prop.name ||
				!this.ts.isIdentifier(prop.name)
			) {
				errors.push({ node: prop, message: "Invalid property." });
				continue;
			}

			const propName = prop.name.text;
			switch (propName) {
				case "default": {
					const parsedDefaultText =
						this.tsHelper.parseJsxInitializerAsString(
							prop.initializer,
						);
					if (parsedDefaultText === undefined) {
						defaultText = "invalid";
						errors.push({
							node: prop,
							message:
								"Invalid default text. Must be a static string!",
						});
					} else {
						defaultText = parsedDefaultText;
					}
					break;
				}
				case "id": {
					const parsedId = this.tsHelper.parseJsxInitializerAsString(
						prop.initializer,
					);
					if (parsedId === undefined) {
						id = "invalid";
						errors.push({
							node: prop,
							message: "Invalid id. Must be a static string!",
						});
					} else {
						id = parsedId;
					}
					break;
				}
				case "description": {
					const parsedDescription =
						this.tsHelper.parseJsxInitializerAsString(
							prop.initializer,
						);
					if (parsedDescription === undefined) {
						description = "invalid";
						errors.push({
							node: prop,
							message:
								"Invalid description. Must be a static string!",
						});
					} else {
						description = parsedDescription;
					}
					break;
				}
				case "data": {
					break;
				}
			}
		}

		if (defaultText === "unset") {
			errors.push({ message: "No default text specified." });
		}

		if (id === "unset") {
			errors.push({
				message: "No id specified.",
				getFixedSource: () => {
					const attributes = this.ts.factory.createJsxAttributes(
						this.ts.factory.createNodeArray([
							...elem.attributes.properties,
							this.ts.factory.createJsxAttribute(
								this.ts.factory.createIdentifier("id"),
								this.ts.factory.createStringLiteral(
									this.generateId(),
								),
							),
						]),
					);

					return this.tsHelper.print(
						this.ts.factory.createJsxSelfClosingElement(
							elem.tagName,
							elem.typeArguments,
							attributes,
						),
					);
					/*return this.tsHelper.editAndPrint(elem, (cloned) => {
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
						(cloned.attributes as any).properties =
							this.ts.factory.createNodeArray([
								...cloned.attributes.properties,
								this.ts.factory.createJsxAttribute(
									this.ts.factory.createIdentifier("id"),
									this.ts.factory.createStringLiteral(
										this.generateId(),
									),
								),
							]);
					});*/
				},
			});
		}

		return {
			id: typeof id !== "string" ? id.value : undefined,
			defaultText:
				typeof defaultText !== "string" ? defaultText.value : "",
			fileName: elem.getSourceFile().fileName,
			range: { pos: elem.getStart(), end: elem.getEnd() },
			parameters: {},
			description:
				typeof description === "object" ? description.value : undefined,
			getSource: ({ id: newId, defaultText: newDefaultText }) => {
				if (typeof id !== "object") {
					throw new Error("Not supported");
				}
				if (typeof defaultText !== "object") {
					throw new Error("Not supported");
				}

				const map = new Map<tsApi.Node, tsApi.Node>();
				if (newId) {
					map.set(
						id.node,
						this.ts.factory.createStringLiteral(newId),
					);
				}
				if (newDefaultText) {
					map.set(
						defaultText.node,
						this.ts.factory.createStringLiteral(newDefaultText),
					);
				}

				return this.tsHelper.print(
					this.ts.transform(elem, [
						this.tsHelper.getReplacingTransformer(map),
					]).transformed[0],
				);
			},
			errors,
		};
	}

	private processTranslatableCall(
		call: tsApi.CallExpression,
	): TranslatableSrcElement {
		let id:
			| { value: string; node: tsApi.StringLiteral }
			| "unset"
			| "invalid" = "unset";
		let description:
			| { value: string; node: tsApi.StringLiteral }
			| "unset"
			| "invalid" = "unset";
		let defaultText:
			| { value: string; node: tsApi.StringLiteral }
			| "unset"
			| "invalid" = "unset";
		const errors = new Array<SrcError>();

		if (call.arguments.length > 2) {
			errors.push({
				message: "Too many arguments",
			});
		}

		if (call.arguments.length >= 1) {
			const parsedDefaultText = this.tsHelper.parseString(
				call.arguments[0],
			);
			if (parsedDefaultText === undefined) {
				defaultText = "invalid";
				errors.push({
					message: "Invalid default text. Must be a static string!",
					node: call.arguments[0],
				});
			} else {
				defaultText = parsedDefaultText;
			}

			if (call.arguments.length >= 2) {
				const options = this.tsHelper.parseObjectLiteral(
					call.arguments[1],
				);

				if (!options) {
					errors.push({
						message: "Invalid options. Must be an object literal!",
						node: call.arguments[1],
					});
					id = "invalid";
				} else {
					const keys = Object.keys(options);
					if (new Set(keys).size !== keys.length) {
						errors.push({
							message: "Duplicate keys!",
							node: call.arguments[1],
						});
					}

					for (const key of keys) {
						if (key === "id") {
							const parsedId = this.tsHelper.parseString(
								options[key],
							);
							if (parsedId === undefined) {
								id = "invalid";
								errors.push({
									message: `Invalid id. Must be a static string!`,
									node: options[key],
								});
							} else {
								id = parsedId;
							}
						} else if (key === "description") {
							const parsedDescription = this.tsHelper.parseString(
								options[key],
							);
							if (parsedDescription === undefined) {
								description = "invalid";
								errors.push({
									message: `Invalid id. Must be a static string!`,
									node: options[key],
								});
							} else {
								description = parsedDescription;
							}
						} else if (key === "data") {
							// todo
						}
					}
				}
			}
		} else {
			errors.push({
				message: "Arguments are missing",
			});
		}

		if (id === "unset") {
			errors.push({
				message: "Id is missing",
				/*getFixedSource: () => {
					return this.tsHelper.editAndPrint(call, (node) => {
						if (node.arguments.length === 1) {
							(node.arguments as any) = this.ts.createNodeArray([
								...node.arguments,
								this.ts.factory.createIdentifier(
									`{ id: "${this.generateId()}" }`,
								),
							]);
						} else {
							const dataArg = node.arguments[1];
							if (
								dataArg &&
								this.ts.isObjectLiteralExpression(dataArg)
							) {
								(dataArg.properties as any) =
									this.ts.factory.createNodeArray([
										...dataArg.properties,
										this.ts.factory.createPropertyAssignment(
											"id",
											this.ts.factory.createStringLiteral(
												this.generateId(),
											),
										),
									]);
							}
						}
					});
				},*/
			});
		}

		return {
			defaultText:
				typeof defaultText === "object" ? defaultText.value : "",
			id: typeof id === "object" ? id.value : undefined,
			parameters: {},
			range: { pos: call.getStart(), end: call.getEnd() },
			fileName: call.getSourceFile().fileName,
			description:
				typeof description === "object" ? description.value : undefined,
			getSource: ({ defaultText: newDefaultText, id: newId }) => {
				if (typeof id !== "object") {
					throw new Error("Not supported");
				}
				if (typeof defaultText !== "object") {
					throw new Error("Not supported");
				}

				const map = new Map<tsApi.Node, tsApi.Node>();
				if (newId) {
					map.set(
						id.node,
						this.ts.factory.createStringLiteral(newId),
					);
				}
				if (newDefaultText) {
					map.set(
						defaultText.node,
						this.ts.factory.createStringLiteral(newDefaultText),
					);
				}
				return this.tsHelper.print(
					this.ts.transform(call, [
						this.tsHelper.getReplacingTransformer(map),
					]).transformed[0],
				);
			},
			errors,
		};
	}
}
