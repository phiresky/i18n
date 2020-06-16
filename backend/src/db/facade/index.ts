import { DbConnection } from "../DbConnector.js";
import { MainFacade } from "./MainFacade.js";
import { VersionFacade } from "./VersionFacade.js";
import { VersionLanguagesFacade } from "./VersionLanguagesFacade.js";
import { VersionTranslationsFacade } from "./VersionTranslationsFacade.js";
import { UserManagementFacade } from "./UserManagementFacade.js";

export class Facades {
	public readonly main: MainFacade;
	public readonly version: VersionFacade;
	public readonly versionLanguages: VersionLanguagesFacade;
	public readonly versionTranslations: VersionTranslationsFacade;
	public readonly userManagement: UserManagementFacade;

	constructor(private readonly connection: DbConnection) {
		this.main = new MainFacade(this.connection);
		this.version = new VersionFacade(this.connection);
		this.versionLanguages = new VersionLanguagesFacade(this.connection);
		this.versionTranslations = new VersionTranslationsFacade(
			this.connection,
		);
		this.userManagement = new UserManagementFacade(this.connection);
	}
}
