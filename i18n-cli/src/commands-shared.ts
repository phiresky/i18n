import { namedParam, types } from "@hediet/cli";
import { I18nProject } from "./model.js";
import { I18nConnection, VersionRef } from "@hediet/i18n-api";
import { getAuthenticatedClient } from "./getAuthenticatedClient.js";

export const backendParams = {
	project: namedParam(types.string, {
		shortName: "p",
		description: "The path to the project json file.",
	}),
	backendUrl: namedParam(types.string.withDefaultValue(undefined), {
		shortName: "b",
	}),
	backendOrg: namedParam(types.string.withDefaultValue(undefined), {}),
	backendProject: namedParam(types.string.withDefaultValue(undefined), {}),
	backendVersion: namedParam(types.string.withDefaultValue(undefined), {}),
	backendToken: namedParam(types.string.withDefaultValue(undefined), {
		shortName: "t",
	}),
};

export class BackendConfig {
	public static from(args: {
		project: string;
		backendUrl?: string;
		backendOrg?: string;
		backendProject?: string;
		backendVersion?: string;
		backendToken?: string;
	}): BackendConfig {
		const p = I18nProject.from(args.project);

		let backendUrl = args.backendUrl;
		let backendOrg = args.backendOrg;
		let backendProject = args.backendProject;
		let backendVersion = args.backendVersion;

		if (p.config.backend) {
			const b = p.config.backend;
			backendUrl = backendUrl || b.url;
			backendOrg = backendOrg || b.org;
			backendProject = backendProject || b.project;
			backendVersion = backendVersion || b.version;
		}

		if (!backendUrl) {
			throw new Error("Arg 'backendUrl' is missing!");
		}
		if (!backendOrg) {
			throw new Error("Arg 'backendOrg' is missing!");
		}
		if (!backendProject) {
			throw new Error("Arg 'backendProject' is missing!");
		}
		if (!backendVersion) {
			throw new Error("Arg 'backendVersion' is missing!");
		}

		return new BackendConfig(
			p,
			backendUrl,
			backendOrg,
			backendProject,
			backendVersion,
			args.backendToken,
		);
	}

	private constructor(
		public readonly project: I18nProject,
		public readonly backendUrl: string,
		public readonly backendOrg: string,
		public readonly backendProject: string,
		public readonly backendVersion: string,
		public readonly backendToken: string | undefined,
	) {}

	public getAuthenticatedClient(): Promise<I18nConnection> {
		return getAuthenticatedClient(this.backendUrl, this.backendToken);
	}

	public getVersionRef(): VersionRef {
		return {
			orgId: this.backendOrg,
			projectId: this.backendProject,
			versionId: this.backendVersion,
		};
	}
}
