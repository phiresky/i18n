import { getBestFittingLanguage } from "@hediet/i18n-api";
import { isLeft } from "fp-ts/lib/Either";
import * as t from "io-ts";
import { PathReporter } from "io-ts/lib/PathReporter";
const translationsType = t.type({
	languageCode: t.string,
	packagesById: t.record(
		t.string,
		t.type({
			translationsByCodeId: t.record(
				t.string,
				t.type({
					translatedFormat: t.string,
					isUntranslatedInRequestedLanguage: t.boolean,
				}),
			),
		}),
	),
});

export type Translations = t.TypeOf<typeof translationsType>;

export interface I18nBackend {
	getSupportedLanguages(): Promise<{ languageCode: string }[]>;
	fetchTranslations(
		acceptedLanguages: ReadonlyArray<string>,
	): Promise<Translations>;
}

export interface HostedI18nBackendConfig {
	serverUrl: string;
	org: string;
	project: string;
	version: string;
	timeoutInMs: number;
}

export class HostedI18nBackend implements I18nBackend {
	constructor(private readonly config: HostedI18nBackendConfig) {}

	public async getSupportedLanguages(): Promise<{ languageCode: string }[]> {
		const languages = await this.fetchJson(
			`${this.config.serverUrl}/orgs/${this.config.org}/projects/${this.config.project}/versions/${this.config.version}/languages`,
			t.type({
				supportedLanguages: t.array(
					t.type({
						languageCode: t.string,
					}),
				),
			}),
		);
		languages.supportedLanguages.forEach((lang) => {
			lang.languageCode = lang.languageCode.split("-")[0];
		});
		return languages.supportedLanguages;
	}

	public async fetchTranslations(
		acceptedLanguages: ReadonlyArray<string>,
	): Promise<Translations> {
		console.time("i18n fetch translations");
		const acceptedLanguagesStr = acceptedLanguages.join(",").toLowerCase();
		const translations = await this.fetchJson(
			`${this.config.serverUrl}/orgs/${this.config.org}/projects/${this.config.project}/versions/${this.config.version}/translations?lang=${acceptedLanguagesStr}`,
			translationsType,
		);
		console.timeEnd("i18n fetch translations");
		return translations;
	}

	private async fetchJson<T>(
		url: string,
		codec: t.Decoder<unknown, T>,
	): Promise<T> {
		const fetchResult = await fetch(url);
		if (!fetchResult.ok) {
			throw new Error("Got non-ok response from I18nBackend.");
		}
		if (
			!(fetchResult.headers.get("content-type") || "").includes(
				"application/json",
			)
		) {
			throw new Error("Got invalid content-type from I18nBackend.");
		}
		const json = (await fetchResult.json()) as unknown;
		const decodeResult = codec.decode(json);
		if (isLeft(decodeResult)) {
			throw new Error(
				`Got invalid JSON from server:\n${PathReporter.report(
					decodeResult,
				).join("\n")}`,
			);
		}
		return decodeResult.right;
	}
}

export type LocalJsonMeta = {
	supportedLanguages: { languageCode: string }[];
	defaultLanguage: { languageCode: string };
};
export class LocalI18nBackend implements I18nBackend {
	private metaInfo?: LocalJsonMeta;
	constructor(private loadFile: (fname: string) => Promise<unknown>) {}
	private async getMetaInfo() {
		if (!this.metaInfo) {
			this.metaInfo = (await this.loadFile("meta")) as LocalJsonMeta;
		}
		return this.metaInfo;
	}
	async getSupportedLanguages(): Promise<{ languageCode: string }[]> {
		return (await this.getMetaInfo()).supportedLanguages;
	}
	async fetchTranslations(
		acceptedLanguages: readonly string[],
	): Promise<Translations> {
		const metaInfo = await this.getMetaInfo();
		const language = getBestFittingLanguage({
			supportedLanguageCodes: (await this.getSupportedLanguages()).map(
				(e) => e.languageCode,
			),
			acceptedLanguageCodes: acceptedLanguages,
			fallbackLanguageCode: metaInfo.defaultLanguage.languageCode,
		});
		if (!language) throw Error(`could not matching language`);
		return (await this.loadFile(
			`translations.${language}`,
		)) as Translations;
	}
}
