import { dirname, resolve } from "path";
import tsApi from "typescript";
import { decodeEntities } from "./decodeEntities.js";

export class TsHelper {
	constructor(private readonly ts: typeof tsApi) {}

	public createProgram(configPath: string): tsApi.Program {
		const parseConfigHost: tsApi.ParseConfigHost = {
			fileExists: this.ts.sys.fileExists,
			readFile: this.ts.sys.readFile,
			readDirectory: this.ts.sys.readDirectory,
			useCaseSensitiveFileNames: true,
		};

		const configFile = this.ts.readConfigFile(
			configPath,
			this.ts.sys.readFile,
		);

		const compilerOptions = this.ts.parseJsonConfigFileContent(
			configFile.config,
			parseConfigHost,
			resolve(dirname(configPath)),
		);
		const host = this.ts.createCompilerHost(compilerOptions.options, true);
		const prog = this.ts.createProgram(
			compilerOptions.fileNames,
			compilerOptions.options,
			host,
		);
		return prog;
	}

	public parseJsxInitializerAsString(
		initializer:
			| tsApi.StringLiteral
			| tsApi.JsxExpression
			| tsApi.JsxAttributeValue
			| undefined,
	):
		| { value: string; node: tsApi.StringLiteral | tsApi.JsxExpression }
		| undefined {
		if (!initializer) {
			return undefined;
		}
		if (this.ts.isStringLiteral(initializer)) {
			return {
				value: decodeEntities(initializer.text),
				node: initializer,
			};
		}
		if (this.ts.isJsxExpression(initializer)) {
			if (!initializer.expression) {
				return undefined;
			}
			const r = this.parseString(initializer.expression);
			if (r) {
				return { value: r.value, node: initializer };
			}
		}
		return undefined;
	}

	public parseString(
		expr: tsApi.Expression,
	): { value: string; node: tsApi.StringLiteral } | undefined {
		if (!this.ts.isStringLiteral(expr)) {
			return undefined;
		}
		return { value: expr.text, node: expr };
	}

	public parseObjectLiteral(
		expr: tsApi.Expression,
	): Record<string, tsApi.Expression> | undefined {
		if (!this.ts.isObjectLiteralExpression(expr)) {
			return undefined;
		}

		const result: Record<string, tsApi.Expression> = {};
		for (const p of expr.properties) {
			if (this.ts.isPropertyAssignment(p)) {
				let key: string | undefined = undefined;
				if (this.ts.isIdentifier(p.name)) {
					key = p.name.text;
				}
				if (!key) {
					// debugger;
					return undefined;
				}

				result[key] = p.initializer;
			} else if (this.ts.isShorthandPropertyAssignment(p)) {
				result[p.name.text] = p.name;
			} else {
				// debugger;
				return undefined;
			}
		}
		return result;
	}
	public print<T extends tsApi.Node>(node: T): string {
		return this.ts
			.createPrinter({})
			.printNode(
				this.ts.EmitHint.Unspecified,
				node,
				node.getSourceFile(),
			);
	}

	public getReplacingTransformer(replacements: Map<tsApi.Node, tsApi.Node>) {
		const getVisitor = (
			ctx: tsApi.TransformationContext,
			sf: tsApi.Node,
		) => {
			const visitor: tsApi.Visitor = (
				node: tsApi.Node,
			): tsApi.VisitResult<tsApi.Node> => {
				const replacement = replacements.get(node);
				if (replacement) {
					return replacement;
				}

				return this.ts.visitEachChild(node, visitor, ctx);
			};
			return visitor;
		};

		return (
				ctx: tsApi.TransformationContext,
			): tsApi.Transformer<tsApi.Node> =>
			(node: tsApi.Node) => {
				const ret = this.ts.visitNode(node, getVisitor(ctx, node));
				if (!ret) throw Error("not visit failed");
				return ret;
			};
	}
}

// See https://stackoverflow.com/a/57367717/188246 for
// why this is necessary.
function stripRanges<T extends tsApi.Node>(node: T) {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	(node as any).pos = -1;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	(node as any).end = -1;
	return node;
}
