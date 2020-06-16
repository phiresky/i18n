import { sTranslatablesWithTranslations } from "@hediet/i18n-api";
import { getOrInitialize } from "../utils";
import { ObservableMap, observable } from "mobx";
import { LocaleTranslations } from "../../../embedded-editor";
import { Model } from ".";
import { encode } from "zwsp-steg";

export class Translations {
	private readonly languagesByLanguageCode = new Map<
		string,
		TranslatedLang
	>();

	public readonly defaultLanguage: TranslatedLang;

	constructor(
		translations: typeof sTranslatablesWithTranslations.T,
		private readonly model: Model,
	) {
		this.defaultLanguage = new TranslatedLang(
			translations.defaultLanguageCode,
			undefined,
			this.model,
		);

		this.languagesByLanguageCode.set(
			this.defaultLanguage.languageCode,
			this.defaultLanguage,
		);

		for (const lang of translations.languages) {
			const locale = getOrInitialize(
				this.languagesByLanguageCode,
				lang.languageCode,
				() =>
					new TranslatedLang(
						lang.languageCode,
						this.defaultLanguage,
						this.model,
					),
			);

			for (const translatable of translations.translatables) {
				const t = translatable.translations.find(
					(t) => t.languageCode === lang.languageCode,
				);
				if (t) {
					locale.addTranslations([
						{
							codeId: translatable.codeId,
							translatedFormat: t.translatedFormat,
							translatableId: translatable.translatableId,
						},
					]);
				}
			}
		}
	}

	public getLanguage(languageCode: string): TranslatedLang {
		const lang = this.languagesByLanguageCode.get(languageCode);
		if (!lang) {
			throw new Error(`Language "${languageCode}" does not exist!`);
		}
		return lang;
	}
}

export class TranslatedLang {
	private readonly translationsByCodeId = new ObservableMap<
		string,
		StandaloneTranslation
	>();

	constructor(
		public readonly languageCode: string,
		public readonly parentLanguage: TranslatedLang | undefined,
		private readonly model: Model,
	) {}

	public addTranslations(translations: StandaloneTranslation[]): void {
		for (const t of translations) {
			this.translationsByCodeId.set(t.codeId, observable(t));
		}
	}

	public getTranslation(codeId: string): StandaloneTranslation | undefined {
		return this.translationsByCodeId.get(codeId);
	}

	renderTranslations(): LocaleTranslations {
		const format = (
			codeId: string,
			translatedFormat: string | null,
		): string => {
			if (!translatedFormat) {
				translatedFormat = "(Untranslated)";
			}

			translatedFormat = encode(codeId) + translatedFormat;

			if (this.model.showTranslatableMarkers) {
				translatedFormat = `🖊️[${translatedFormat}]`;
			}
			return translatedFormat;
		};

		return {
			languageCode: this.languageCode,
			translateUnknown: (translatable) => {
				return {
					codeId: translatable.codeId,
					translatedFormat: format(
						translatable.codeId,
						translatable.defaultFormat,
					),
				};
			},
			translations: [...this.translationsByCodeId.values()].map(
				(translatable) => {
					let translatedFormat = translatable.translatedFormat;
					if (!translatedFormat && this.parentLanguage) {
						const p = this.parentLanguage.getTranslation(
							translatable.codeId,
						);
						if (p) {
							translatedFormat = p.translatedFormat;
						}
					}

					return {
						codeId: translatable.codeId,
						translatedFormat: format(
							translatable.codeId,
							translatedFormat,
						),
					};
				},
			),
		};
	}

	public async setTranslation(
		translatableId: number,
		translatedFormat: string | null,
	): Promise<void> {
		await this.model.client.connection!.versionApi.postTranslation({
			languageCode: this.languageCode,
			translatableId,
			translatedFormat,
			version: {
				orgId: this.model.settings.organizationId!,
				projectId: this.model.settings.projectId!,
				versionId: this.model.settings.versionId!,
			},
		});
	}
}

interface StandaloneTranslation {
	translatableId: number;
	codeId: string;
	translatedFormat: string | null;
}
