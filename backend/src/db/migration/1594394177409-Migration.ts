import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1594394177409 implements MigrationInterface {
	name = "Migration1594394177409";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "temporary_translatable_format" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "packageId" varchar NOT NULL, "codeId" varchar NOT NULL, "owningVersionId" integer, "isStale" boolean NOT NULL DEFAULT (0), "codeDefaultFormat" varchar, "description" varchar, CONSTRAINT "UQ_0db45d03cb7105968b843b73d15" UNIQUE ("owningVersionId", "codeId"), CONSTRAINT "FK_d5b873f6115d1d56e57f359b41a" FOREIGN KEY ("owningVersionId") REFERENCES "version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "temporary_translatable_format"("id", "packageId", "codeId", "owningVersionId", "isStale") SELECT "id", "packageId", "codeId", "owningVersionId", "isStale" FROM "translatable_format"`,
		);
		await queryRunner.query(`DROP TABLE "translatable_format"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_translatable_format" RENAME TO "translatable_format"`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "translatable_format" RENAME TO "temporary_translatable_format"`,
		);
		await queryRunner.query(
			`CREATE TABLE "translatable_format" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "packageId" varchar NOT NULL, "codeId" varchar NOT NULL, "owningVersionId" integer, "isStale" boolean NOT NULL DEFAULT (0), CONSTRAINT "UQ_0db45d03cb7105968b843b73d15" UNIQUE ("owningVersionId", "codeId"), CONSTRAINT "FK_d5b873f6115d1d56e57f359b41a" FOREIGN KEY ("owningVersionId") REFERENCES "version" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
		);
		await queryRunner.query(
			`INSERT INTO "translatable_format"("id", "packageId", "codeId", "owningVersionId", "isStale") SELECT "id", "packageId", "codeId", "owningVersionId", "isStale" FROM "temporary_translatable_format"`,
		);
		await queryRunner.query(`DROP TABLE "temporary_translatable_format"`);
	}
}
