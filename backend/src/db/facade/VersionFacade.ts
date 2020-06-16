import {
	sTranslatablesSyncResult,
	sTranslatablesUpdate,
	sVersionExport,
	sVersionInfo,
} from "@hediet/i18n-api";
import { diffBy, diffObjectKeys } from "../../utils/diffObjectsKeys.js";
import { toObject } from "../../utils/other.js";
import {
	TranslatableFormatEntity,
	TranslatedFormatEntity,
	VersionEntity,
	VersionLanguageEntity,
} from "../entities/index.js";
import { BaseVersionFacade, VersionRef } from "./BaseVersionFacade.js";

export class VersionFacade extends BaseVersionFacade {
	public async getVersionInfo(versionRef: VersionRef): Promise<
		| {
				languages: {
					languageCode: string;
					published: boolean;
					name: string;
					translatedWords: number;
					translatedPercent: number;
				}[];
				defaultLangCode: string | null;
				locked: boolean;
		  }
		| { error: "orgNotFound" }
		| { error: "projectNotFound" }
		| { error: "versionNotFound" }
	> {
		const v = await this.getVersion(versionRef, {
			relations: ["languages", "defaultLanguage"],
		});
		if ("error" in v) {
			return v;
		}

		const result = await this.connection.versionLanguages
			.createQueryBuilder("lang")
			.where("lang.owningVersionId = :value", { value: v.id })
			.leftJoin("lang.translatedFormats", "translation")
			.leftJoin(
				"translation.owningFormat",
				"translatable",
				"NOT(translatable.isStale)",
			)
			.leftJoin(
				"translatable.translatedFormats",
				"defaultTranslation",
				"defaultTranslation.owningLanguageId = :defaultLang AND translation.acceptedTranslation NOT NULL",
				{ defaultLang: v.defaultLanguage!.id },
			)
			.groupBy("languageCode")
			.select("languageCode")
			.addSelect("COALESCE(SUM(translation.words), 0)", "translatedWords")
			.addSelect(
				"COALESCE(SUM(defaultTranslation.words), 0)",
				"defaultTranslatedWords",
			)
			.getRawMany<{
				languageCode: string;
				translatedWords: number;
				defaultTranslatedWords: number;
			}>();

		const info = new Map(result.map((item) => [item.languageCode, item]));

		return {
			languages: v.languages.map((l) => {
				const translatedWords =
					info.get(l.languageCode)!.defaultTranslatedWords || 0;
				const translatedWordsInDefault = info.get(
					(v.defaultLanguage || l).languageCode,
				)!.defaultTranslatedWords;
				const actualTranslatedWords =
					info.get(l.languageCode)!.translatedWords || 0;

				return {
					languageCode: l.languageCode,
					name: l.name,
					published: l.published,
					translatedWords: actualTranslatedWords,
					translatedPercent:
						translatedWordsInDefault === 0
							? 0
							: (translatedWords * 100) /
								translatedWordsInDefault,
				};
			}),
			defaultLangCode: v.defaultLanguage
				? v.defaultLanguage.languageCode
				: null,
			locked: v.locked,
		};
	}

	public async getVersions(context: {
		orgId: string;
		projectId: string;
	}): Promise<
		| (typeof sVersionInfo.T)[]
		| { error: "orgNotFound" }
		| { error: "projectNotFound" }
	> {
		const project = await this.getProject(context);
		if ("error" in project) {
			return project;
		}

		const versions = await this.connection.versions.find({
			where: {
				owningProject: project,
			},
			order: {
				iteration: "DESC",
			},
		});
		return versions.map((v) => ({
			id: v.versionId,
			name: v.label,
			iteration: v.iteration,
			versionId: v.versionId,
			locked: v.locked,
		}));
	}

	public async deriveVersion(
		context: {
			orgId: string;
			projectId: string;
		},
		details: {
			name: string;
			parents: { versionId: string }[];
		},
	): Promise<
		| typeof sVersionInfo.T
		| { error: "orgNotFound" }
		| { error: "projectNotFound" }
	> {
		const project = await this.getProject(context);
		if ("error" in project) {
			return project;
		}

		const latestVersions = await this.connection.versions
			.createQueryBuilder("version")
			.andWhere("version.label = :name", { name: details.name })
			.orderBy("version.iteration", "DESC")
			.limit(1)
			.getMany();

		const prevIteration =
			latestVersions.length > 0 ? latestVersions[0].iteration : 0;

		if (details.parents.length === 0) {
			throw new Error("No parents specified!");
		}

		const parentVersions = await Promise.all(
			details.parents.map(async (p) => {
				const r = await this.getVersion({
					...context,
					versionId: p.versionId,
				});
				if ("error" in r) {
					throw r;
				}
				return r;
			}),
		);

		const newVersionEntity = VersionEntity.create(
			project,
			details.name,
			parentVersions,
			prevIteration,
		);
		await this.connection.versions.save(newVersionEntity);

		const data = await this.exportVersion(parentVersions[0]);
		await this.importVersion(newVersionEntity, data);

		return {
			id: newVersionEntity.versionId,
			iteration: newVersionEntity.iteration,
			name: newVersionEntity.label,
			locked: newVersionEntity.locked,
		};
	}

	public async exportVersion(
		versionRef: VersionRef,
	): Promise<typeof sVersionExport.T> {
		const version = await this.getVersion(versionRef, {
			relations: ["languages", "defaultLanguage"],
		});
		if ("error" in version) {
			throw new Error();
		}

		const languages = new Map(
			version.languages.map((l) => [l.id, l.languageCode]),
		);
		const selectedLanguages = [...languages.keys()];

		const result = await this.connection.translatableFormats
			.createQueryBuilder("translatable")
			.leftJoinAndSelect(
				"translatable.translatedFormats",
				"translatedFormat",
			)
			.where(
				"translatedFormat.owningLanguageId IN (:...selectedLanguages)",
				{ selectedLanguages },
			)
			.andWhere("NOT(translatable.isStale)")
			.orderBy("translatable.packageId")
			.getMany();

		return {
			defaultLanguageCode: version.defaultLanguage!.languageCode,
			languages: version.languages.map((l) => ({
				languageCode: l.languageCode,
				name: l.name,
			})),
			translatables: result.map((t) => ({
				packageId: t.packageId,
				codeId: t.codeId,
				description: null,
				translations: t.translatedFormats.map((t) => ({
					languageCode: languages.get(t.owningLanguageId)!,
					translatedFormat: t.acceptedTranslation,
				})),
			})),
		};
	}

	public async importVersion(
		versionRef: VersionRef,
		data: typeof sVersionExport.T,
		options: {
			deleteOld: false; // TODO
		} = {
			deleteOld: false,
		},
	): Promise<void> {
		const version = await this.getVersion(versionRef, {
			join: {
				alias: "version",
				leftJoinAndSelect: {
					languages: "version.languages",
					translatableFormats: "version.translatableFormats",
					translatedFormats: "translatableFormats.translatedFormats",
				},
			},
		});
		if ("error" in version) {
			throw new Error(version.error);
		}
		if (version.locked) {
			throw new Error("Version is locked! Unlock version first!");
		}

		const languagesToSave = new Array<VersionLanguageEntity>();

		for (const diff of diffBy(
			version.languages,
			data.languages,
			(l) => l.languageCode,
		)) {
			const existingLanguage = diff.val1;
			const newLanguage = diff.val2;

			if (newLanguage && !existingLanguage) {
				const lang = this.connection.versionLanguages.create({
					owningVersion: version,
					languageCode: newLanguage.languageCode,
					name: newLanguage.name,
				});
				languagesToSave.push(lang);
			}
		}
		await this.connection.versionLanguages.save(languagesToSave);
		const updatedLanguages = toObject(
			await this.connection.versionLanguages.findBy({
				owningVersion: { id: version.id },
			}),
			(i) => i.languageCode,
		);

		await this.connection.versions.save({
			id: version.id,
			defaultLanguage: updatedLanguages[data.defaultLanguageCode],
		});

		const translatablesToSave = new Array<TranslatableFormatEntity>();
		const translationsToSave = new Array<TranslatedFormatEntity>();

		for (const diff of diffBy(
			version.translatableFormats,
			data.translatables,
			(t) => t.codeId,
		)) {
			const existingTranslatable = diff.val1;
			const newTranslatable = diff.val2;
			if (newTranslatable) {
				let translatableEntity: TranslatableFormatEntity;
				if (!existingTranslatable) {
					translatableEntity =
						this.connection.createTranslatableFormatEntity({
							codeId: newTranslatable.codeId,
							owningVersion: version,
							packageId: newTranslatable.packageId,
						});
					translatablesToSave.push(translatableEntity);
				} else {
					translatableEntity = existingTranslatable;
					// existingTranslatable.packageId =
					//	existingTranslatable.packageId;
					translatablesToSave.push(existingTranslatable);
				}

				const existingTranslations = toObject(
					translatableEntity.translatedFormats || [],
					(t) => t.owningLanguage.languageCode,
				);
				for (const trans of newTranslatable.translations) {
					const existing = existingTranslations[trans.languageCode];
					if (existing) {
						existing.acceptedTranslation = trans.translatedFormat;
						translationsToSave.push(existing);
					} else {
						const owningLanguage =
							updatedLanguages[trans.languageCode];
						if (!owningLanguage) {
							throw new Error(`Should not happen`);
						}
						const translatedFormatEntity =
							this.connection.createTranslatedFormatEntity({
								owningFormat: translatableEntity,
								acceptedTranslation: trans.translatedFormat,
								version: 1,
								owningLanguage,
							});
						translationsToSave.push(translatedFormatEntity);
					}
				}
			}
		}

		await this.connection.translatableFormats.save(translatablesToSave, {
			chunk: 500,
		});
		await this.connection.translatedFormats.save(translationsToSave, {
			chunk: 500,
		});

		await this.createEmptyTranslations(version.id);
	}

	public async deleteVersion(version: VersionRef): Promise<void> {
		const versionEntity = await this.getVersion(version);
		if ("error" in versionEntity) {
			throw versionEntity;
		}
		if (versionEntity.locked) {
			throw new Error("Version is locked! Unlock first!");
		}
		await this.connection.versions.remove(versionEntity);
	}

	/*
    public async postVersion(
        context: { orgId: string; projectId: string },
        details: {
            label: string;
            supportedLanguageCodes: string[] | undefined;
            defaultLanguageCode: string;
        }
    ): Promise<void | { error: "projectNotFound" } | { error: "orgNotFound" }> {
        const project = await this.getProject(context.orgId, context.projectId);
        if ("error" in project) {
            return project;
        }

        const versionEntity = VersionEntity.create(project, details.label, []);

        await this.connection.versions.save(versionEntity);

        const repo = this.connection.versionLanguages;

        if (details.supportedLanguageCodes) {
            await repo.save(
                details.supportedLanguageCodes.map(languageCode =>
                    repo.create({ languageCode, owningVersion: versionEntity })
                )
            );
        }

        if (details.defaultLanguageCode) {
            const defaultLang = await repo.findOneOrFail({
                languageCode: details.defaultLanguageCode,
            });
            await this.connection.versions.update(
                { id: versionEntity.id },
                { defaultLanguage: defaultLang }
            );
        }
    }*/

	public async updateVersion(
		versionRef: VersionRef,
		config: { defaultLanguageCode?: string; locked?: boolean },
	): Promise<void> {
		const version = await this.getVersion(versionRef, {
			relations: ["languages", "defaultLanguage"],
		});

		if ("error" in version) {
			throw new Error();
		}

		if (config.locked !== undefined) {
			version.locked = config.locked;
		}

		if (config.defaultLanguageCode) {
			const defaultLang = version.languages.find(
				(l) => l.languageCode === config.defaultLanguageCode,
			);
			if (!defaultLang) {
				throw new Error(
					`Language "${config.defaultLanguageCode}" does not exist.`,
				);
			}

			version.defaultLanguage = defaultLang;
		}
		await this.connection.versions.save(version);
	}

	public async updateTranslatables({
		update,
		versionRef,
	}: {
		versionRef: VersionRef;
		update: typeof sTranslatablesUpdate.T;
	}): Promise<
		| typeof sTranslatablesSyncResult.T
		| { error: "projectNotFound" }
		| { error: "orgNotFound" }
		| { error: "versionNotFound" }
	> {
		const version = await this.getVersion(versionRef);
		if ("error" in version) {
			return version;
		}

		if (version.locked) {
			throw new Error("Version is locked!");
		}
		const defaultLangEntity =
			await this.connection.versionLanguages.findOneBy({
				languageCode: update.defaultLanguageCode,
				owningVersion: { id: version.id },
			});

		if (!defaultLangEntity) {
			throw new Error(
				`Default language ${update.defaultLanguageCode} does not exist!`,
			);
		}

		await this.createEmptyTranslations(version.id);
		const versionWithRefs = await this.connection.versions
			.createQueryBuilder("version")
			.andWhere("version.id = :id", { id: version.id })
			.leftJoinAndSelect(
				"version.translatableFormats",
				"translatableFormat",
			)
			.leftJoinAndSelect(
				"translatableFormat.translatedFormats",
				"translatedFormat",
				"translatedFormat.owningLanguageId = :langId",
				{ langId: defaultLangEntity.id },
			)
			.getOne();

		if (!versionWithRefs) {
			throw new Error("bug");
		}

		const result: typeof sTranslatablesSyncResult.T = {
			addedTranslatables: [],
			removedTranslatables: [],
			updatedTranslatables: [],
		};

		const entitiesToSave = new Array<
			TranslatableFormatEntity | TranslatedFormatEntity
		>();

		for (const diff of diffObjectKeys(
			toObject(versionWithRefs.translatableFormats, (t) => t.codeId),
			toObject(update.translatables, (t) => t.codeId),
		)) {
			const { val1: existingFormat, val2: newFormat } = diff;

			if (existingFormat && !newFormat) {
				if (!existingFormat.isStale) {
					const shallowExistingFormat =
						this.connection.createTranslatableFormatEntity({
							id: existingFormat.id,
						});
					shallowExistingFormat.isStale = true;
					entitiesToSave.push(shallowExistingFormat);

					result.removedTranslatables.push({
						codeId: existingFormat.codeId,
					});
				}
			} else if (!existingFormat && newFormat) {
				//entitiesToCreate + insert default translation
				const newFormatEntity =
					this.connection.createTranslatableFormatEntity({
						codeId: newFormat.codeId,
						owningVersion: versionWithRefs,
						description: newFormat.description,
						codeDefaultFormat: newFormat.defaultFormat,
						isStale: false,
						packageId: newFormat.packageId,
					});
				result.addedTranslatables.push({
					codeId: newFormat.codeId,
					wasStale: false,
				});
				entitiesToSave.push(newFormatEntity);

				const defaultFormat =
					this.connection.createTranslatedFormatEntity({
						acceptedTranslation: newFormat.defaultFormat,
						owningLanguage: defaultLangEntity,
						owningFormat: newFormatEntity,
						version: 1,
					});
				entitiesToSave.push(defaultFormat);
			} else if (existingFormat && newFormat) {
				let shallowExistingFormat:
					| TranslatableFormatEntity
					| undefined = undefined;
				const getShallowExistingFormat = () => {
					if (!shallowExistingFormat) {
						shallowExistingFormat =
							this.connection.createTranslatableFormatEntity({
								id: existingFormat.id,
							});
						entitiesToSave.push(shallowExistingFormat);
					}
					return shallowExistingFormat;
				};

				const existingTranslatedEntity =
					existingFormat.translatedFormats[0];

				let updated = false;

				if (
					existingFormat.packageId !== newFormat.packageId ||
					existingFormat.isStale ||
					existingFormat.description !== newFormat.description
				) {
					getShallowExistingFormat().isStale = false;
					getShallowExistingFormat().packageId = newFormat.packageId;
					getShallowExistingFormat().description =
						newFormat.description;
					updated = true;
				}

				let updateKind: (typeof sTranslatablesSyncResult.T.updatedTranslatables)[0]["defaultFormatUpdate"];

				// if two of these are false, then all three are false
				const acceptedTranslationChanged =
					existingFormat.codeDefaultFormat !==
					existingTranslatedEntity.acceptedTranslation;
				const defaultFormatChanged =
					existingFormat.codeDefaultFormat !==
					newFormat.defaultFormat;
				const acceptedTranslationDiffersDefaultFormat =
					existingTranslatedEntity.acceptedTranslation !==
					newFormat.defaultFormat;

				if (
					(defaultFormatChanged && !acceptedTranslationChanged) ||
					existingTranslatedEntity.acceptedTranslation === null
				) {
					// default format has been changed and accepted translation has not been changed or is invalid
					getShallowExistingFormat().codeDefaultFormat =
						newFormat.defaultFormat;
					updateKind = {
						kind: "didUpdateDefaultLanguage",
						oldTranslatedFormat:
							existingTranslatedEntity.acceptedTranslation,
						newTranslatedFormat: newFormat.defaultFormat,
					};
					existingTranslatedEntity.acceptedTranslation =
						newFormat.defaultFormat;
					entitiesToSave.push(existingTranslatedEntity);
					updated = true;
				} else if (defaultFormatChanged && acceptedTranslationChanged) {
					if (!acceptedTranslationDiffersDefaultFormat) {
						// conflict has been solved:
						// both the translation in the default language
						// and the default format have been changed to the same value.
						getShallowExistingFormat().codeDefaultFormat =
							newFormat.defaultFormat;
						updateKind = { kind: "none" };
					} else {
						// conflict: Don't do anything. Suggest to resolve the conflict.
						updateKind = {
							kind: "shouldUpdateSource",
							suggestedDefaultFormat:
								existingTranslatedEntity.acceptedTranslation,
						};
						updated = true;
					}
				} else {
					if (defaultFormatChanged) {
						throw new Error("impossible");
					}

					if (acceptedTranslationChanged) {
						if (!acceptedTranslationDiffersDefaultFormat) {
							throw new Error("impossible");
						}

						// suggest updating default format in code
						updateKind = {
							kind: "shouldUpdateSource",
							suggestedDefaultFormat:
								existingTranslatedEntity.acceptedTranslation,
						};
						updated = true;
					} else {
						if (acceptedTranslationDiffersDefaultFormat) {
							throw new Error("impossible");
						}

						// nothing changed. Nothing to do.
						updateKind = { kind: "none" };
					}
				}

				if (updated) {
					if (existingFormat.isStale) {
						result.addedTranslatables.push({
							codeId: newFormat.codeId,
							wasStale: true,
						});
					} else {
						result.updatedTranslatables.push({
							codeId: newFormat.codeId,
							defaultFormatUpdate: updateKind,
						});
					}
				}
			}
		}

		await this.connection.instance.manager.save(entitiesToSave);
		await this.createEmptyTranslations(versionWithRefs.id);

		return result;
	}
}
