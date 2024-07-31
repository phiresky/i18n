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

@Entity("translatable_format")
@Unique(["owningVersion", "codeId"])
export class TranslatableFormatEntity {
	@PrimaryGeneratedColumn({ type: "integer" })
	id!: number;

	@Column({ type: "varchar" })
	packageId!: string;

	@Column({ type: "varchar" })
	codeId!: string;

	@Column({ type: "varchar", nullable: true })
	codeDefaultFormat!: string | null;

	@Column({ type: "varchar", nullable: true })
	description!: string | null;

	@Column({ type: "boolean", default: false })
	isStale!: boolean;

	@ManyToOne(
		(type) => VersionEntity,
		(entity) => entity.translatableFormats,
		{ onDelete: "CASCADE" },
	)
	owningVersion!: Relation<VersionEntity>;

	@OneToMany(
		(type) => TranslatedFormatEntity,
		(entity) => entity.owningFormat,
	)
	translatedFormats!: TranslatedFormatEntity[];
}
