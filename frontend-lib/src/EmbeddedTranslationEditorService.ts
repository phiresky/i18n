import {
	LocaleTranslations,
	setEmbeddedTranslationEditorSocket,
} from "@hediet/i18n-frontend/embedded-editor";
import { action, makeObservable, observable } from "mobx";

const embeddedI18nEditorConfigKey = "embeddedI18nEditorConfig";

export type EmbeddedEditorConfig = {
	/**
	 * This parameter allows module splitting as well as to link a custom
	 * embedded editor widget to satisfy the conditions of LGPLv3.
	 */
	load: () => Promise<void>;
};
type RuntimeConfig = {
	version: 1;
	enabled: boolean;
};

export class EmbeddedTranslationEditorService {
	public readonly initialized: Promise<void>;

	@observable
	private _localeTranslations: LocaleTranslations | undefined;

	public get localeTranslations(): LocaleTranslations | undefined {
		return this._localeTranslations;
	}

	private runtimeConfig!: RuntimeConfig;

	constructor(private readonly config: EmbeddedEditorConfig) {
		makeObservable(this);
		this.loadConfig();

		const i18nEditorQueryParam = new URLSearchParams(
			window.location.search,
		).get("embeddedI18nEditor");

		if (i18nEditorQueryParam !== null) {
			this.setConfig({
				version: 1,
				enabled: true,
			});
		}

		if (this.runtimeConfig.enabled) {
			this.initialized = Promise.all([
				new Promise<void>((res) => {
					setEmbeddedTranslationEditorSocket({
						set: (localeTranslations) => {
							action(
								"Update translations from embedded i18n editor",
								() => {
									this._localeTranslations =
										localeTranslations;
								},
							)();
						},
						initialized: () => {
							res();
						},
						close: () => {
							this.setConfig({
								version: 1,
								enabled: false,
							});
							window.location.reload();
						},
					});
				}),
				this.config.load(),
			]).then(() => {});
		} else {
			this.initialized = Promise.resolve();
		}
	}

	private setConfig(config: RuntimeConfig): void {
		this.runtimeConfig = config;
		this.saveConfig();
	}

	private loadConfig(): void {
		const config = localStorage.getItem(embeddedI18nEditorConfigKey);
		if (config === null) {
			this.runtimeConfig = {
				version: 1,
				enabled: false,
			};
		} else {
			this.runtimeConfig = JSON.parse(config) as RuntimeConfig;
		}
	}

	private saveConfig(): void {
		if (this.runtimeConfig.enabled) {
			localStorage.setItem(
				embeddedI18nEditorConfigKey,
				JSON.stringify(this.runtimeConfig),
			);
		} else {
			localStorage.removeItem(embeddedI18nEditorConfigKey);
		}
	}
}
