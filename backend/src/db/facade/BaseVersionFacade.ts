import {
	VersionEntity,
	ProjectEntity,
	VersionLanguageEntity,
	TranslatableFormatEntity,
} from "../entities/index.js";
import { FindOneOptions } from "typeorm";
import { BaseFacade } from "./BaseFacade.js";
import { flatMap } from "../../utils/other.js";

export type VersionRef =
	| {
			orgId: string;
			projectId: string;
			versionId: string;
	  }
	| { id: number };

export abstract class BaseVersionFacade extends BaseFacade {
	protected async getProject(context: {
		orgId: string;
		projectId: string;
	}): Promise<
		ProjectEntity | { error: "projectNotFound" } | { error: "orgNotFound" }
	> {
		const org = await this.getOrg({ orgId: context.orgId });
		if ("error" in org) {
			return org;
		}
		const result = await this.connection.projects.findOneBy({
			projectId: context.projectId,
			owningOrg: org,
		});
		if (result) {
			return result;
		} else {
			return { error: "projectNotFound" };
		}
	}

	protected async getVersion(
		versionRef: VersionRef,
		options?: FindOneOptions<VersionEntity>,
	): Promise<
		| VersionEntity
		| { error: "orgNotFound" }
		| { error: "projectNotFound" }
		| { error: "versionNotFound" }
	> {
		console.assert(!options || !("where" in options));
		if ("id" in versionRef) {
			const version = await this.connection.versions.findOne({
				...options,
				where: { id: versionRef.id },
			});
			if (!version) {
				return { error: "versionNotFound" };
			}
			if (version.languages) {
				version.sortLanguages();
			}
			return version;
		} else {
			const project = await this.getProject({
				orgId: versionRef.orgId,
				projectId: versionRef.projectId,
			});
			if ("error" in project) {
				return project;
			}
			const version = await this.connection.versions.findOne({
				...options,
				where: {
					owningProject: project,
					...VersionEntity.parseVersionId(versionRef.versionId),
				},
			});
			if (!version) {
				return { error: "versionNotFound" };
			}
			if (version.languages) {
				version.sortLanguages();
			}
			return version;
		}
	}

	public async createEmptyTranslations(versionId: number): Promise<void> {
		const result = (await this.connection.translatableFormats
			.createQueryBuilder("translatable")
			.andWhere("translatable.owningVersionId = :versionId", {
				versionId,
			})
			.leftJoinAndMapMany(
				"translatable.untranslatedLanguages",
				VersionLanguageEntity,
				"versionLanguage",
				"versionLanguage.owningVersionId = translatable.owningVersionId",
			)
			.andWhere(
				`(translatable.id, versionLanguage.id) NOT IN (SELECT translated_format.owningFormatId, translated_format.owningLanguageId from translated_format)`,
			)
			.getMany()) as (TranslatableFormatEntity & {
			untranslatedLanguages: VersionLanguageEntity[];
		})[];

		const items = flatMap(result, (format) =>
			format.untranslatedLanguages.map((untransLang) =>
				this.connection.createTranslatedFormatEntity({
					version: 1,
					acceptedTranslation: null,
					owningFormat: format,
					owningLanguage: untransLang,
				}),
			),
		);

		await this.connection.translatedFormats.save(items, { chunk: 500 });
	}
}
