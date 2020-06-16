import { VersionRef } from "@hediet/i18n-api";
import { computed, makeObservable, observable, ObservableSet } from "mobx";
import { fromPromise } from "mobx-utils";
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

	@computed get data() {
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
			pending: (v) => [],
			rejected: (v) => [],
		});
	}

	@computed get defaultLangCode(): string | undefined {
		return this.data.case({
			fulfilled: (v) => v.defaultLanguageCode,
			pending: (v) => undefined,
			rejected: (v) => undefined,
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
}
