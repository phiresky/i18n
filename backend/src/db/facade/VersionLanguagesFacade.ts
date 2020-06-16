import { BaseVersionFacade, VersionRef } from "./BaseVersionFacade.js";

export class VersionLanguagesFacade extends BaseVersionFacade {
	public async addLanguage(
		versionRef: VersionRef,
		languageCode: string,
		languageName: string,
	): Promise<void> {
		const version = await this.getVersion(versionRef, {
			relations: ["defaultLanguage"],
		});
		if ("error" in version) {
			throw new Error(version.error);
		}

		const langEntity = this.connection.versionLanguages.create({
			languageCode,
			name: languageName,
			owningVersion: version,
			published: !version.defaultLanguage,
		});
		await this.connection.versionLanguages.save(langEntity);

		if (!version.defaultLanguage) {
			version.defaultLanguage = langEntity;
			//version.defaultLanguage = langEntity;
			//langEntity.owningVersion = version;
			//console.log(version, langEntity);
			await this.connection.versions.save(version);
		}
		//await this.connection.versionLanguages.save(langEntity);
		await this.createEmptyTranslations(version.id);
	}

	public async updateLanguage(
		versionRef: VersionRef,
		languageCode: string,
		config: { published?: boolean; name?: string },
	): Promise<void> {
		const version = await this.getVersion(versionRef, {
			relations: ["languages"],
		});

		if ("error" in version) {
			throw new Error();
		}

		const lang = version.languages.find(
			(l) => l.languageCode === languageCode,
		);
		if (!lang) {
			throw new Error(`Language "${languageCode}" does not exist.`);
		}

		if (config.published !== undefined) {
			lang.published = config.published;
		}
		if (config.name !== undefined) {
			lang.name = config.name;
		}
		await this.connection.versionLanguages.save(lang);
	}

	public async deleteLanguage(
		versionRef: VersionRef,
		languageCode: string,
	): Promise<void> {
		const version = await this.getVersion(versionRef, {
			relations: ["languages", "defaultLanguage"],
		});
		if ("error" in version) {
			throw new Error(version.error);
		}

		const lang = version.languages.find(
			(l) => l.languageCode === languageCode,
		);
		if (!lang) {
			throw new Error(`Lang "${languageCode}" does not exist!`);
		}

		if (version.defaultLanguage && lang.id === version.defaultLanguage.id) {
			throw new Error("Cannot delete default language!");
		}
		await this.connection.versionLanguages.remove(lang);
	}
}
