import { MigrationInterface, QueryRunner, Not, IsNull } from "typeorm";
import { TranslatedFormatEntity } from "../entities/index.js";
import { countWords } from "../../utils/other.js";

export class Migration1594044623054 implements MigrationInterface {
	name = "Migration1594044623054";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "temporary_translatable_format" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "packageId" varchar NOT NULL, "codeId" varchar NOT NULL, "owningVersionId" integer, "isStale" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_0db45d03cb7105968b843b73d15" UNIQUE ("owningVersionId", "codeId"), CONSTRAINT "FK_d5b873f6115d1d56e57f359b41a" FOREIGN KEY ("owningVersionId") REFERENCES "version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "temporary_translatable_format"("id", "packageId", "codeId", "owningVersionId") SELECT "id", "packageId", "codeId", "owningVersionId" FROM "translatable_format"`,
		);
		await queryRunner.query(`DROP TABLE "translatable_format"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_translatable_format" RENAME TO "translatable_format"`,
		);
		await queryRunner.query(
			`CREATE TABLE "temporary_translated_format" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "owningLanguageId" integer NOT NULL, "version" integer NOT NULL, "acceptedTranslation" varchar, "suggestedTranslation" varchar, "owningFormatId" integer NOT NULL, "words" integer NOT NULL, CONSTRAINT "UQ_7fe397ea2d8dcbd152089f0a756" UNIQUE ("owningFormatId", "owningLanguageId"), CONSTRAINT "FK_d4e7296ce531567d9c266fb10f9" FOREIGN KEY ("owningFormatId") REFERENCES "translatable_format" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_eff361451545aa75e8f98cd06a2" FOREIGN KEY ("owningLanguageId") REFERENCES "version_language" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "temporary_translated_format"("id", "owningLanguageId", "version", "acceptedTranslation", "suggestedTranslation", "owningFormatId", "words") SELECT "id", "owningLanguageId", "version", "acceptedTranslation", "suggestedTranslation", "owningFormatId", 0 FROM "translated_format"`,
		);
		await queryRunner.query(`DROP TABLE "translated_format"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_translated_format" RENAME TO "translated_format"`,
		);

		await queryRunner.query(
			`CREATE TABLE "temporary_version_language" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "languageCode" varchar NOT NULL, "owningVersionId" integer NOT NULL, "published" boolean NOT NULL DEFAULT (0), "name" varchar NOT NULL, CONSTRAINT "UQ_24d33918e4068bbd8d45f0f6d1c" UNIQUE ("owningVersionId", "languageCode"), CONSTRAINT "FK_375d7c622e9fbcd47e3e637d822" FOREIGN KEY ("owningVersionId") REFERENCES "version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "temporary_version_language"("id", "languageCode", "owningVersionId", "published", "name") SELECT "id", "languageCode", "owningVersionId", "published", "languageCode" FROM "version_language"`,
		);
		await queryRunner.query(`DROP TABLE "version_language"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_version_language" RENAME TO "version_language"`,
		);
		await queryRunner.query(
			`CREATE TABLE "temporary_version_language" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "languageCode" varchar NOT NULL, "owningVersionId" integer NOT NULL, "published" boolean NOT NULL DEFAULT (0), "name" varchar NOT NULL, CONSTRAINT "UQ_24d33918e4068bbd8d45f0f6d1c" UNIQUE ("owningVersionId", "languageCode"), CONSTRAINT "UQ_3f984b1738c781fe2d76b0d4d17" UNIQUE ("owningVersionId", "name"), CONSTRAINT "FK_375d7c622e9fbcd47e3e637d822" FOREIGN KEY ("owningVersionId") REFERENCES "version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "temporary_version_language"("id", "languageCode", "owningVersionId", "published", "name") SELECT "id", "languageCode", "owningVersionId", "published", "name" FROM "version_language"`,
		);
		await queryRunner.query(`DROP TABLE "version_language"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_version_language" RENAME TO "version_language"`,
		);

		const em = queryRunner.connection.createEntityManager(queryRunner);
		const repo = em.getRepository(TranslatedFormatEntity);
		const items = await repo.find({
			where: { acceptedTranslation: Not(IsNull()) },
		});
		for (const item of items) {
			item.words = countWords(item.acceptedTranslation!);
		}
		await repo.save(items);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "version_language" RENAME TO "temporary_version_language"`,
		);
		await queryRunner.query(
			`CREATE TABLE "version_language" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "languageCode" varchar NOT NULL, "owningVersionId" integer NOT NULL, "published" boolean NOT NULL DEFAULT (0), "name" varchar NOT NULL, CONSTRAINT "UQ_24d33918e4068bbd8d45f0f6d1c" UNIQUE ("owningVersionId", "languageCode"), CONSTRAINT "FK_375d7c622e9fbcd47e3e637d822" FOREIGN KEY ("owningVersionId") REFERENCES "version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "version_language"("id", "languageCode", "owningVersionId", "published", "name") SELECT "id", "languageCode", "owningVersionId", "published", "name" FROM "temporary_version_language"`,
		);
		await queryRunner.query(`DROP TABLE "temporary_version_language"`);
		await queryRunner.query(`DROP INDEX "IDX_09ef1483226646db01104f6f75"`);
		await queryRunner.query(
			`ALTER TABLE "version_language" RENAME TO "temporary_version_language"`,
		);
		await queryRunner.query(
			`CREATE TABLE "version_language" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "languageCode" varchar NOT NULL, "owningVersionId" integer NOT NULL, "published" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_24d33918e4068bbd8d45f0f6d1c" UNIQUE ("owningVersionId", "languageCode"), CONSTRAINT "FK_375d7c622e9fbcd47e3e637d822" FOREIGN KEY ("owningVersionId") REFERENCES "version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "version_language"("id", "languageCode", "owningVersionId", "published") SELECT "id", "languageCode", "owningVersionId", "published" FROM "temporary_version_language"`,
		);
		await queryRunner.query(`DROP TABLE "temporary_version_language"`);
		await queryRunner.query(
			`ALTER TABLE "translated_format" RENAME TO "temporary_translated_format"`,
		);
		await queryRunner.query(
			`CREATE TABLE "translated_format" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "owningLanguageId" integer NOT NULL, "version" integer NOT NULL, "acceptedTranslation" varchar, "suggestedTranslation" varchar, "owningFormatId" integer NOT NULL, CONSTRAINT "UQ_7fe397ea2d8dcbd152089f0a756" UNIQUE ("owningFormatId", "owningLanguageId"), CONSTRAINT "FK_d4e7296ce531567d9c266fb10f9" FOREIGN KEY ("owningFormatId") REFERENCES "translatable_format" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_eff361451545aa75e8f98cd06a2" FOREIGN KEY ("owningLanguageId") REFERENCES "version_language" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "translated_format"("id", "owningLanguageId", "version", "acceptedTranslation", "suggestedTranslation", "owningFormatId") SELECT "id", "owningLanguageId", "version", "acceptedTranslation", "suggestedTranslation", "owningFormatId" FROM "temporary_translated_format"`,
		);
		await queryRunner.query(`DROP TABLE "temporary_translated_format"`);
		await queryRunner.query(
			`ALTER TABLE "translatable_format" RENAME TO "temporary_translatable_format"`,
		);
		await queryRunner.query(
			`CREATE TABLE "translatable_format" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "packageId" varchar NOT NULL, "codeId" varchar NOT NULL, "owningVersionId" integer, CONSTRAINT "UQ_0db45d03cb7105968b843b73d15" UNIQUE ("owningVersionId", "codeId"), CONSTRAINT "FK_d5b873f6115d1d56e57f359b41a" FOREIGN KEY ("owningVersionId") REFERENCES "version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "translatable_format"("id", "packageId", "codeId", "owningVersionId") SELECT "id", "packageId", "codeId", "owningVersionId" FROM "temporary_translatable_format"`,
		);
		await queryRunner.query(`DROP TABLE "temporary_translatable_format"`);
	}
}
