import { fromPromise, IPromiseBasedObservable } from "mobx-utils";
import {
	ObservableMap,
	observable,
	action,
	reaction,
	makeObservable,
} from "mobx";
import { I18nBackend, Translations } from "./I18nBackend";
import { getOrInitialize, failAfterTimeout } from "./utils";
import {
	EmbeddedEditorConfig,
	EmbeddedTranslationEditorService,
} from "./EmbeddedTranslationEditorService";
import {
	LocaleTranslations,
	Translatable,
} from "@hediet/i18n-frontend/embedded-editor";

export type I18nServiceConfig = {
	backend: I18nBackend;
	embeddedEditor?: EmbeddedEditorConfig;
	initTimeoutMs: number;
};
export class I18nService {
	public readonly initialized: IPromiseBasedObservable<void>;
	private readonly localesByLanguageCode = new ObservableMap<
		string,
		Locale
	>();
	private readonly embeddedTranslationEditorService?: EmbeddedTranslationEditorService;

	@observable
	private _currentLocale: Locale | undefined;

	public get currentLocale(): Locale {
		if (!this._currentLocale) {
			throw new Error(
				"Locale has not been defined yet. You need to wait for the 'initialized' promise!",
			);
		}
		return this._currentLocale;
	}
	private readonly backend: I18nBackend;
	private readonly initTimeoutMs: number;

	constructor(private readonly config: I18nServiceConfig) {
		makeObservable(this);
		this.backend = config.backend;
		this.initTimeoutMs = config.initTimeoutMs;

		if (typeof window !== "undefined" && this.config.embeddedEditor) {
			this.embeddedTranslationEditorService =
				new EmbeddedTranslationEditorService(
					this.config.embeddedEditor,
				);

			reaction(
				() => this.embeddedTranslationEditorService!.localeTranslations,
				(overridingLocaleTranslations) => {
					if (overridingLocaleTranslations) {
						this.overrideTranslations(overridingLocaleTranslations);
					} else {
						this.fetchFromBackendAndSetCurrentLocale().catch(
							console.error,
						);
					}
				},
				{
					name: "Override translations from translations from embedded i18n editor",
				},
			);
		}

		this.initialized = fromPromise(this.initialize().catch(console.error));
	}

	private async initialize(): Promise<void> {
		// By default, this promise resolves immediately.
		if (this.embeddedTranslationEditorService) {
			await this.embeddedTranslationEditorService.initialized;
		}

		if (!this._currentLocale) {
			// This happens if the reaction has not been triggered, which is usually the case.
			try {
				await failAfterTimeout(
					this.initTimeoutMs,
					this.fetchFromBackendAndSetCurrentLocale(),
				);
			} catch (e: any) {
				console.error(e);
				this._currentLocale = this.getLocale(navigator.language);
			}
		}
	}

	@action
	private overrideTranslations(
		overridingLocaleTranslations: LocaleTranslations,
	): void {
		const locale = this.getLocale(
			overridingLocaleTranslations.languageCode,
			"editor",
		);
		locale.handleUnknownTranslatable = (translatable) =>
			overridingLocaleTranslations.translateUnknown(translatable);
		for (const l of overridingLocaleTranslations.translations) {
			locale.setTranslatedFormat({
				codeId: l.codeId,
				translatedFormat: l.translatedFormat,
			});
		}
		this._currentLocale = locale;
	}
	private getAcceptedLanguages(): string[] {
		if (typeof window === "undefined") {
			return ["en-US"];
		} else {
			return [...navigator.languages];
		}
	}

	private async fetchFromBackendAndSetCurrentLocale(): Promise<void> {
		const acceptedLangs = this.getAcceptedLanguages();
		const preferredLang = this.getPreferredLanguage();
		if (preferredLang) {
			acceptedLangs.unshift(preferredLang);
		}
		const translations =
			await this.backend.fetchTranslations(acceptedLangs);

		action("Update translations", () => {
			const locale = this.getLocale(translations.languageCode);
			locale.addPackages(translations.packagesById);
			this._currentLocale = locale;
		})();
	}

	public getSupportedLanguages(): Promise<{ languageCode: string }[]> {
		return this.backend.getSupportedLanguages();
	}

	private readonly localStorageKey = "i18nPreferredLang";

	private setPreferredLanguage(lang: string | undefined): void {
		if (lang) {
			localStorage.setItem(this.localStorageKey, lang);
		} else {
			localStorage.removeItem(this.localStorageKey);
		}
	}

	private getPreferredLanguage(): string | undefined {
		if (typeof window !== "undefined") {
			return localStorage.getItem(this.localStorageKey) || undefined;
		} else {
			return undefined;
		}
	}

	public setLanguage(options: { languageCode: string }): Promise<void> {
		this.setPreferredLanguage(options.languageCode);
		return this.fetchFromBackendAndSetCurrentLocale();
	}

	/** @param key Used to create overriding locales. */
	private getLocale(languageCode: string, key = "default"): Locale {
		return getOrInitialize(
			this.localesByLanguageCode,
			languageCode + "#" + key,
			() => new Locale(languageCode, key),
		);
	}
}

export class Locale {
	public handleUnknownTranslatable?: (
		t: Translatable,
	) => { translatedFormat: string } | undefined;

	constructor(
		public readonly languageCode: string,
		public readonly key: string,
	) {
		makeObservable(this);
	}

	@observable private readonly translationByCodeId = new Map<
		string,
		Translation
	>();

	public getTranslation(codeId: string): Translation | undefined {
		return this.translationByCodeId.get(codeId);
	}

	@action
	public clear(): void {
		this.translationByCodeId.clear();
	}

	@action
	public setTranslatedFormat(arg: {
		codeId: string;
		translatedFormat: string;
	}): void {
		const translation = getOrInitialize(
			this.translationByCodeId,
			arg.codeId,
			() => new Translation(arg.translatedFormat),
		);
		translation.translatedFormat = arg.translatedFormat;
	}

	public getTranslatedFormat(codeId: string, defaultFormat: string): string {
		if (!codeId) {
			throw new Error("CodeId is not defined!");
		}

		const t = this.getTranslation(codeId);
		if (!t) {
			if (this.handleUnknownTranslatable) {
				const result = this.handleUnknownTranslatable({
					codeId,
					defaultFormat,
				});
				if (result) {
					return result.translatedFormat;
				}
			}
			//console.error(`Format ${codeId} is missing. Default translation is "${defaultFormat}".`);
			return defaultFormat;
		}
		return t.translatedFormat;
	}

	public addPackages(packagesById: Translations["packagesById"]): void {
		for (const pkg of Object.values(packagesById)) {
			for (const [codeId, translation] of Object.entries(
				pkg.translationsByCodeId,
			)) {
				this.setTranslatedFormat({
					codeId,
					translatedFormat: translation.translatedFormat,
				});
			}
		}
	}
}

class Translation {
	@observable
	public translatedFormat: string;

	constructor(translatedFormat: string) {
		this.translatedFormat = translatedFormat;
		makeObservable(this);
	}
}
