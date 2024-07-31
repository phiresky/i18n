import {
	Entity,
	PrimaryGeneratedColumn,
	ManyToOne,
	Column,
	Unique,
	Relation,
} from "typeorm";
import { TranslatableFormatEntity } from "./TranslatableFormatEntity.js";
import { VersionLanguageEntity } from "./VersionLanguageEntity.js";
import { countWords } from "../../utils/other.js";

@Entity("translated_format")
@Unique(["owningFormat", "owningLanguage"])
export class TranslatedFormatEntity {
	@PrimaryGeneratedColumn({ type: "integer" })
	id!: number;

	@ManyToOne(
		(type) => VersionLanguageEntity,
		(entity) => entity.translatedFormats,
		{ onDelete: "CASCADE" },
	)
	owningLanguage!: Relation<VersionLanguageEntity>;

	@Column()
	owningLanguageId!: number;

	@ManyToOne(
		(type) => TranslatableFormatEntity,
		(entity) => entity.translatedFormats,
		{ onDelete: "CASCADE", nullable: false },
	)
	owningFormat!: TranslatableFormatEntity;

	@Column()
	owningFormatId!: number;

	@Column()
	version!: number;

	@Column({ type: "varchar", nullable: true, name: "acceptedTranslation" })
	private _acceptedTranslation!: string | null;

	public get acceptedTranslation(): string | null {
		return this._acceptedTranslation;
	}

	public set acceptedTranslation(value: string | null) {
		this._acceptedTranslation = value;
		this.words = countWords(value || "");
	}

	@Column({ type: "varchar", nullable: true })
	suggestedTranslation!: string | null;

	@Column()
	words!: number;
}
