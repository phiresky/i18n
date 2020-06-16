import { VersionRef } from "@hediet/i18n-api";
import { computed, action, observable, makeObservable } from "mobx";
import { fromPromise } from "mobx-utils";
import { Model } from "../../../model";
import { pendingPromise } from "../../../../common/pendingPromise";
import { makeLoggable } from "mobx-log";

export class VersionSettingsPageModel {
	@observable cacheKey = 0;

	constructor(
		public readonly parentModel: Model,
		public readonly version: VersionRef,
	) {
		makeObservable(this);
		makeLoggable(this);
	}

	@computed get data() {
		this.cacheKey;
		const client = this.parentModel.internalClient;
		return fromPromise(
			client
				? client.versionApi
						.getVersionInfo({
							version: this.version,
						})
						.then((v) => observable(v))
				: pendingPromise,
		);
	}

	public refresh(): void {
		this.cacheKey++;
	}

	@action
	async configureVersion(details: {
		defaultLanguageCode?: string;
		locked?: boolean;
	}) {
		await this.parentModel.internalClient!.versionApi.updateVersion({
			version: this.version,
			...details,
		});
		if (this.data.state === "fulfilled") {
			if (details.defaultLanguageCode) {
				this.data.value.defaultLanguageCode =
					details.defaultLanguageCode;
			}
			if (details.locked !== undefined) {
				this.data.value.locked = details.locked;
			}
		} else {
			this.refresh();
		}
	}

	@action
	async setDetails(
		languageCode: string,
		details: { published?: boolean; name?: string },
	) {
		await this.parentModel.internalClient!.versionApi.updateLanguage({
			version: this.version,
			languageCode,
			details,
		});
		if (this.data.state === "fulfilled") {
			const l = this.data.value.languages.find(
				(l) => l.languageCode === languageCode,
			);
			if (l) {
				if (details.published !== undefined) {
					l.published = details.published;
				}
				if (details.name !== undefined) {
					l.name = details.name;
				}
			}
		} else {
			this.refresh();
		}
	}
}
