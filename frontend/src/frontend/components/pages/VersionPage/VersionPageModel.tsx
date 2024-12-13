import { sTranslatablesWithTranslations, VersionRef } from "@hediet/i18n-api";
import {
	computed,
	makeObservable,
	observable,
	ObservableSet,
	runInAction,
} from "mobx";
import { fromPromise, IPromiseBasedObservable } from "mobx-utils";
import { pendingPromise } from "../../../../common/pendingPromise";
import { Model } from "../../../model";

export enum StateFilter {
	all = "all",
	translated = "translated",
	untranslated = "untranslated",
}

export class VersionPageModel {
	constructor(
		public readonly model: Model,
		public readonly version: VersionRef,
	) {
		makeObservable(this);
	}

	@computed get data(): IPromiseBasedObservable<
		typeof sTranslatablesWithTranslations.T
	> {
		const client = this.model.internalClient;
		return fromPromise(
			client
				? client.versionApi
						.getTranslatablesWithTranslations({
							version: this.version,
						})
						.then((v) => observable(v))
				: pendingPromise,
		);
	}

	@observable search = "";

	@observable stateFilter: StateFilter = StateFilter.all;

	@computed get languages(): { languageCode: string }[] {
		return this.data.case({
			fulfilled: (v) => v.languages,
			pending: () => [],
			rejected: () => [],
		});
	}

	@computed get defaultLangCode(): string | undefined {
		return this.data.case({
			fulfilled: (v) => v.defaultLanguageCode,
			pending: () => undefined,
			rejected: () => undefined,
		});
	}

	public readonly filteredLanguages = new ObservableSet<string>();
	public readonly filteredPackageIds = new ObservableSet<string>();

	shouldShowLanguageCode(languageCode: string): boolean {
		if (this.filteredLanguages.size === 0) {
			return true;
		}
		return this.filteredLanguages.has(languageCode);
	}

	shouldShowPackage(pkgId: string): boolean {
		if (this.filteredPackageIds.size === 0) {
			return true;
		}
		return this.filteredPackageIds.has(pkgId);
	}

	public async suggestTranslations(): Promise<void> {
		const client = this.model.internalClient;
		if (!client) {
			return;
		}

		if (this.data.state !== "fulfilled") {
			return;
		}

		const version = this.version;
		const translatables = this.data.value.translatables;

		for (const translatable of translatables) {
			if (!this.shouldShowPackage(translatable.packageId)) {
				continue;
			}

			for (const translation of translatable.translations) {
				const languageCode = translation.languageCode;
				if (!this.shouldShowLanguageCode(languageCode)) {
					continue;
				}

				if (translation.translatedFormat === null) {
					try {
						await client.versionApi.suggestTranslation({
							version,
							translatableId: translatable.translatableId,
							targetLanguageCode: languageCode,
						});
					} catch (error) {
						console.error(
							`Failed to suggest translation for translatableId ${translatable.translatableId}, languageCode ${languageCode}:`,
							error,
						);
					}
				}
			}
		}

		// Refresh data by forcing a new promise
		runInAction(() => {
			const client = this.model.internalClient;
			if (client) {
				fromPromise(
					client.versionApi
						.getTranslatablesWithTranslations({
							version: this.version,
						})
						.then((v) => observable(v)),
				);
			}
		});
	}
}
