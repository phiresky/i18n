import { DataSource, DataSourceOptions, Repository } from "typeorm";
import { isDev } from "../env.js";
import {
	OrganizationEntity,
	OrganizationMembershipEntity,
	ProjectEntity,
	TranslatableFormatEntity,
	TranslatedFormatEntity,
	UserEntity,
	VersionEntity,
	VersionLanguageEntity,
} from "./entities/index.js";
import { TokenEntity } from "./entities/TokenEntity.js";

export class DbConnector {
	public static getConfig(dbPath: string): DataSourceOptions {
		return {
			type: "better-sqlite3",
			database: dbPath,
			logging: process.env["LOG_ALL"]
				? "all"
				: ["error", "schema", "warn"],
			synchronize: true,
			entities: [
				OrganizationEntity,
				UserEntity,
				OrganizationMembershipEntity,
				ProjectEntity,
				VersionEntity,
				TranslatableFormatEntity,
				VersionLanguageEntity,
				TranslatedFormatEntity,
				TokenEntity,
			],
			/*cli: {
				migrationsDir: "src/db/migration",
			},*/
		};
	}

	private readonly connectionPromise: Promise<DbConnection>;

	constructor(private readonly dbPath: string) {
		this.connectionPromise = this.init();
	}

	private async init(): Promise<DbConnection> {
		const ds = new DataSource(DbConnector.getConfig(this.dbPath));
		await ds.initialize();

		if (isDev()) {
			console.log("synchronizing db schema...");
			await ds.query("PRAGMA foreign_keys=OFF");
			await ds.synchronize();
			await ds.query("PRAGMA foreign_keys=ON");
			console.log("finished");
		} else {
			console.log("running migrations...");
			await ds.query("PRAGMA foreign_keys=OFF");
			await ds.runMigrations();
			await ds.query("PRAGMA foreign_keys=ON");
			console.log("finished");
		}

		return new DbConnection(ds);
	}

	public getConnection(): Promise<DbConnection> {
		return this.connectionPromise;
	}
}

export class DbConnection {
	public readonly organizations: Repository<OrganizationEntity>;
	public readonly users: Repository<UserEntity>;
	public readonly organizationMemberships: Repository<OrganizationMembershipEntity>;
	public readonly projects: Repository<ProjectEntity>;
	public readonly versions: Repository<VersionEntity>;
	public readonly translatableFormats: Repository<TranslatableFormatEntity>;
	public readonly versionLanguages: Repository<VersionLanguageEntity>;
	public readonly translatedFormats: Repository<TranslatedFormatEntity>;
	public readonly tokens: Repository<TokenEntity>;

	public constructor(public readonly instance: DataSource) {
		this.organizations = this.instance.getRepository(OrganizationEntity);
		this.users = this.instance.getRepository(UserEntity);
		this.organizationMemberships = this.instance.getRepository(
			OrganizationMembershipEntity,
		);
		this.projects = this.instance.getRepository(ProjectEntity);
		this.versions = this.instance.getRepository(VersionEntity);
		this.translatableFormats = this.instance.getRepository(
			TranslatableFormatEntity,
		);
		this.versionLanguages = this.instance.getRepository(
			VersionLanguageEntity,
		);
		this.translatedFormats = this.instance.getRepository(
			TranslatedFormatEntity,
		);
		this.tokens = this.instance.getRepository(TokenEntity);
	}

	public createTranslatableFormatEntity(
		data: Partial<TranslatableFormatEntity>,
	): TranslatableFormatEntity {
		return Object.assign(new TranslatableFormatEntity(), data);
	}

	public createTranslatedFormatEntity(
		data: Partial<TranslatedFormatEntity>,
	): TranslatedFormatEntity {
		return Object.assign(new TranslatedFormatEntity(), data);
	}
}
