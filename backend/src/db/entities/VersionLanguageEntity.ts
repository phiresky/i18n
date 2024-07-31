import {
	Entity,
	PrimaryGeneratedColumn,
	ManyToOne,
	Column,
	OneToMany,
	Unique,
	Relation,
} from "typeorm";
import { VersionEntity } from "./VersionEntity.js";
import { TranslatedFormatEntity } from "./TranslatedFormatEntity.js";

@Entity("version_language")
@Unique(["owningVersion", "languageCode"])
@Unique(["owningVersion", "name"])
export class VersionLanguageEntity {
	@PrimaryGeneratedColumn({ type: "integer" })
	id!: number;

	// de-DE or de
	@Column({ type: "varchar" })
	languageCode!: string;

	@Column({ type: "varchar" })
	name!: string;

	@Column({ type: "boolean", default: false })
	published!: boolean;

	@ManyToOne((type) => VersionEntity, (entity) => entity.languages, {
		onDelete: "CASCADE",
	})
	owningVersion!: Relation<VersionEntity>;

	@OneToMany(
		(type) => TranslatedFormatEntity,
		(entity) => entity.owningLanguage,
	)
	translatedFormats!: TranslatedFormatEntity[];
}
