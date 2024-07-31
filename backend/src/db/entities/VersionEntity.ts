import {
	Entity,
	PrimaryGeneratedColumn,
	ManyToOne,
	Column,
	OneToMany,
	ManyToMany,
	Unique,
	OneToOne,
	JoinColumn,
	JoinTable,
	Relation,
} from "typeorm";
import { ProjectEntity } from "./ProjectEntity.js";
import { VersionLanguageEntity } from "./VersionLanguageEntity.js";
import { TranslatableFormatEntity } from "./TranslatableFormatEntity.js";

@Unique(["owningProject", "label", "iteration"])
@Entity("version")
export class VersionEntity {
	public static parseVersionId(versionId: string): {
		label: string;
		iteration: number;
	} {
		const parts = versionId.split("-");
		const label = parts.slice(0, -1).join("-");
		const iteration = parseInt(parts[parts.length - 1], 10);
		return { label, iteration };
	}

	public static create(
		project: ProjectEntity,
		name: string,
		parentVersions: VersionEntity[],
		prevIteration: number,
	): VersionEntity {
		const o = new VersionEntity();
		o.owningProject = project;
		o.label = name;
		o.parentVersions = parentVersions;
		o.iteration =
			parentVersions.reduce(
				(p, c) => Math.max(p, c.iteration, prevIteration),
				0,
			) + 1;
		return o;
	}

	@PrimaryGeneratedColumn({ type: "integer" })
	id!: number;

	get versionId(): string {
		return `${this.label}-${this.iteration}`;
	}

	@Column({ type: "integer" })
	iteration!: number;

	@Column({ type: "varchar" })
	label!: string;

	@Column({ type: "boolean", default: false })
	locked!: boolean;

	@ManyToOne((type) => ProjectEntity, (entity) => entity.versions, {
		onDelete: "CASCADE",
	})
	owningProject!: Relation<ProjectEntity>;

	@ManyToMany((type) => VersionEntity, (entity) => entity.childVersions)
	@JoinTable()
	parentVersions!: VersionEntity[];

	@ManyToMany((type) => VersionEntity, (entity) => entity.parentVersions)
	childVersions!: VersionEntity[];

	@OneToMany(
		(type) => TranslatableFormatEntity,
		(entity) => entity.owningVersion,
	)
	translatableFormats!: TranslatableFormatEntity[];

	@OneToMany(
		(type) => VersionLanguageEntity,
		(entity) => entity.owningVersion,
	)
	languages!: VersionLanguageEntity[];

	public sortLanguages(): void {
		this.languages.sort((a, b) =>
			a.languageCode.localeCompare(b.languageCode),
		);
	}

	@OneToOne((type) => VersionLanguageEntity, {
		nullable: true,
	})
	@JoinColumn()
	defaultLanguage!: VersionLanguageEntity | null;
}
