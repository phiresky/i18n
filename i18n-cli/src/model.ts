import {
	TranslatableParameterInfo,
	TranslatableSrcElement,
} from "@hediet/i18n-static-analysis";
import {
	JSONValue,
	prop,
	sArrayOf,
	sMap,
	sNumber,
	sObject,
	sString,
	sUnion,
} from "@hediet/semantic-json";
import { readFileSync } from "fs";
import micromatch from "micromatch";
import { dirname, resolve } from "path";
import { groupBy } from "./utils.js";

const sPackageConfig = sObject({
	priority: prop(sNumber(), {
		optional: { withDefault: 100 },
	}),
	// relative to the config file
	sourceFiles: sArrayOf(sString()),
});

export const sProjectConfig = sObject(
	{
		// relative to the config file
		tsconfig: sUnion([sString(), sArrayOf(sString())]),
		packages: sMap(sPackageConfig),
		backend: prop(
			sObject({
				url: sString(),
				org: sString(),
				project: sString(),
				version: sString(),
			}),
			{
				optional: true,
			},
		),
		localExport: prop(sObject({ path: sString() }), { optional: true }),
	},
	{
		allowUnknownProperties: true,
	},
);

export class I18nProject {
	public static from(configPath: string): I18nProject {
		const projectConfigPath = resolve(configPath);
		const projectConfigJson = JSON.parse(
			readFileSync(projectConfigPath, { encoding: "utf-8" }),
		) as JSONValue;
		const projectConfig =
			sProjectConfig.deserialize(projectConfigJson).value;

		return new I18nProject(projectConfig, dirname(projectConfigPath));
	}

	private readonly packagesByName: Map<string, I18nPackage>;

	public readonly packages: ReadonlyArray<I18nPackage>;

	constructor(
		public readonly config: typeof sProjectConfig.T,
		public readonly baseDir: string,
	) {
		this.packagesByName = new Map(
			Object.entries(this.config.packages).map(([key, value]) => [
				key,
				new I18nPackage(key, value, this.baseDir),
			]),
		);
		this.packages = [...this.packagesByName.values()].sort(
			(a, b) => b.priority - a.priority,
		);
	}

	get tsConfigPaths(): { absolutePath: string }[] {
		const tsconfigs =
			typeof this.config.tsconfig === "string"
				? [this.config.tsconfig]
				: this.config.tsconfig;
		return tsconfigs.map((configPath) => ({
			absolutePath: resolve(this.baseDir, configPath),
		}));
	}

	getPackage(translatable: Translatable): I18nPackage | undefined {
		for (const p of this.packages) {
			if (
				translatable.srcElements
					.map((e) => e.fileName)
					.every((fileName) => p.mightContain(fileName))
			) {
				return p;
			}
		}
		return undefined;
	}
}

export class I18nPackage {
	public get priority(): number {
		return this.config.priority;
	}

	constructor(
		public readonly packageId: string,
		private readonly config: typeof sPackageConfig.T,
		private readonly baseDir: string,
	) {}

	public mightContain(fileName: string): boolean {
		const absolutePatterns = this.config.sourceFiles.map((f) =>
			resolve(this.baseDir, f).replace(/\\/g, "/"),
		);
		return micromatch.any(fileName.replace(/\\/g, "/"), absolutePatterns);
	}
}

export class Translatables {
	private readonly srcElements = new Array<TranslatableSrcElement>();

	get translatables(): Translatable[] {
		const result = new Array<Translatable>();
		for (const [id, srcElements] of groupBy(
			this.srcElements,
			(e) => e.id,
		)) {
			if (!id) {
				continue;
			}
			const first = srcElements[0];
			// TODO implement errors
			result.push({
				id,
				defaultText: first.defaultText,
				description: first.description,
				parameters: first.parameters,
				srcElements: srcElements,
			});
		}
		return result;
	}

	addTranslatableSrcElement(translatable: TranslatableSrcElement): void {
		this.srcElements.push(translatable);
	}
}

export interface Translatable {
	defaultText: string;
	id: string;
	parameters: Record<string, TranslatableParameterInfo>;
	description: string | undefined;

	srcElements: TranslatableSrcElement[];
}
