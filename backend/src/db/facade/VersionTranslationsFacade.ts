import {
	parseRFC5646LanguageTag,
	sTranslatablesWithTranslations,
	sTranslationsForLanguageCode,
} from "@hediet/i18n-api";
import { groupBy } from "../../utils/other.js";
import { BaseVersionFacade, VersionRef } from "./BaseVersionFacade.js";

export class VersionTranslationsFacade extends BaseVersionFacade {
	public async postTranslation(
		isAdmin: boolean,
		versionRef: VersionRef,
		translatableId: number,
		languageCode: string,
		translatedFormat: string | null,
	): Promise<void> {
		const version = await this.getVersion(versionRef);
		if ("error" in version) {
			throw new Error();
		}
		if (version.locked && !isAdmin) {
			throw new Error(
				"Version is locked. Only admins can update translations!",
			);
		}

		const repo = this.connection.translatedFormats;
		const result = await repo
			.createQueryBuilder("translatedFormatEntity")
			.innerJoinAndSelect(
				"translatedFormatEntity.owningFormat",
				"owningFormat",
				"owningFormat.id = :translatableId",
				{ translatableId },
			)
			.innerJoinAndSelect(
				"translatedFormatEntity.owningLanguage",
				"owningLanguage",
				"owningLanguage.languageCode = :languageCode",
				{ languageCode },
			)
			.andWhere("owningLanguage.owningVersionId = :versionId", {
				versionId: version.id,
			})
			.getOne();

		if (!result) {
			throw new Error("Translated entity does not exist. This is a bug");
		}
		result.acceptedTranslation = translatedFormat;
		await repo.save(result);
	}

	public async getTranslatablesWithTranslation(
		versionRef: VersionRef,
	): Promise<typeof sTranslatablesWithTranslations.T> {
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

		const repo = this.connection.translatableFormats;
		const result = await repo
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

		const resultGroupedByPackage = groupBy(result, (r) => r.packageId);
		return {
			defaultLanguageCode: version.defaultLanguage!.languageCode,
			includesAllPackages: true,
			languages: version.languages.map((l) => ({
				languageCode: l.languageCode,
			})),
			packages: [...resultGroupedByPackage].map(([packageId]) => ({
				includesAllTranslatables: true,
				packageId,
			})),
			translatables: result.map((t) => ({
				codeId: t.codeId,
				translatableId: t.id,
				packageId: t.packageId,
				description: t.description,
				translations: t.translatedFormats
					.map((t) => ({
						languageCode: languages.get(t.owningLanguageId)!,
						translatedFormat: t.acceptedTranslation,
					}))
					.sort((t1, t2) =>
						t1.languageCode.localeCompare(t2.languageCode),
					),
			})),
		};
	}

	public async getTranslationsForLanguageCode(
		versionRef: VersionRef,
		languageCode: string,
		requestedPackageIds: string[] | undefined,
	): Promise<typeof sTranslationsForLanguageCode.T> {
		const version = await this.getVersion(versionRef, {
			relations: ["languages"],
		});
		if ("error" in version) {
			throw new Error();
		}

		const lang = version.languages.find(
			(l) =>
				parseRFC5646LanguageTag(l.languageCode).language ===
				languageCode,
		);

		const defaultLang = version.languages.find(
			(l) => l.languageCode === "en",
		);

		if (!lang) {
			throw new Error(`Lang "${languageCode}" not found!`);
		}
		if (!defaultLang) {
			throw new Error(`Lang "${languageCode}" not found!`);
		}

		const relevantLanguages = [lang.id, defaultLang.id];

		const result = await this.connection.translatableFormats
			.createQueryBuilder("translatable")
			.leftJoinAndSelect(
				"translatable.translatedFormats",
				"translatedFormat",
			)
			.where(
				"translatedFormat.owningLanguageId IN (:...relevantLanguages)",
				{ relevantLanguages },
			)
			.andWhere("NOT(translatable.isStale)")
			.orderBy("translatable.packageId")
			.getMany();

		const translatablesGroupedByPackage = groupBy(
			result,
			(t) => t.packageId,
		);

		return {
			languageCode,
			includesAllPackages: true,
			packagesById: Object.fromEntries(
				[...translatablesGroupedByPackage].map(
					([packageId, translatables]) => [
						packageId,
						{
							includesAllTranslatables: true,
							translationsByCodeId: Object.fromEntries(
								translatables.map((t) => {
									let isUntranslatedInRequestedLanguage =
										false;
									let targetFormat = t.translatedFormats.find(
										(f) => f.owningLanguageId === lang.id,
									)!;
									if (
										targetFormat.acceptedTranslation ===
										null
									) {
										isUntranslatedInRequestedLanguage =
											true;
										targetFormat = t.translatedFormats.find(
											(f) =>
												f.owningLanguageId ===
												defaultLang.id,
										)!;
									}

									// TODO consider fall back languages!
									return [
										t.codeId,
										{
											translatedFormat:
												targetFormat.acceptedTranslation ||
												"",
											isUntranslatedInRequestedLanguage,
										},
									];
								}),
							),
						},
					],
				),
			),
		};
	}
}
