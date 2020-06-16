import { namedParam, types } from "@hediet/cli";
import process from "node:process";
import { cmdDef } from "../cli.js";
import { Config } from "../GlobalConfig.js";
import { I18nProject } from "../model.js";

export const logoutCmd = cmdDef({
	name: "backend:logout",
	description: "Deletes stored auth tokens for the given backend.",
	namedParams: {
		project: namedParam(types.string.withDefaultValue(undefined), {
			shortName: "p",
		}),
		backendUrl: namedParam(types.string.withDefaultValue(undefined), {
			shortName: "b",
		}),
	},
	getData: (args) => ({
		// eslint-disable-next-line @typescript-eslint/require-await
		async run() {
			let backendUrl = args.backendUrl;
			if (!backendUrl && args.project) {
				const project = I18nProject.from(args.project);
				if (project.config.backend) {
					backendUrl = project.config.backend.url;
				}
			}

			if (!backendUrl) {
				console.error(
					"Either a backend url or a project with a backend url must be set!",
				);
				process.exit(-1);
			}

			const config = Config.getGlobal();
			if (config.deleteToken(backendUrl)) {
				console.log(
					`Successfully removed token for backend url "${backendUrl}".`,
				);
			} else {
				console.log(`No token found for backend url "${backendUrl}"!`);
			}
			process.exit(0);
		},
	}),
});
