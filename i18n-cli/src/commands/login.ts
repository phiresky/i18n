import read from "read";
import { promisify } from "util";
import { I18nProject } from "../model.js";
import { I18nConnection } from "@hediet/i18n-api";
import { Config } from "../GlobalConfig.js";
import { cmdDef } from "../cli.js";
import { namedParam, types } from "@hediet/cli";

export const loginCmd = cmdDef({
	name: "backend:login",
	description: "Creates and persists an auth token.",
	namedParams: {
		project: namedParam(types.string.withDefaultValue(undefined), {
			shortName: "p",
		}),
		backendUrl: namedParam(types.string.withDefaultValue(undefined), {
			shortName: "b",
		}),
		username: namedParam(types.string, {
			shortName: "u",
		}),
		password: namedParam(types.string.withDefaultValue(undefined), {}),
		printToken: namedParam(types.booleanFlag, {
			description:
				"When set, the auth token will be printed and not persisted",
		}),
	},
	getData: (args) => ({
		async run() {
			let backendUrl = args.backendUrl;
			if (!backendUrl && args.project) {
				const p = I18nProject.from(args.project);
				if (p.config.backend) {
					backendUrl = p.config.backend.url;
				}
			}

			if (!backendUrl) {
				console.error(
					"Either a backend url or a project with a backend url must be set!",
				);
				process.exit(-1);
			}

			const client = await I18nConnection.connectTo(backendUrl);

			const password =
				args.password ||
				(await promisify(read)({
					prompt: "Enter Password: ",
					silent: true,
				}));

			const { authToken } = await client.authApi.login({
				usernameOrEmail: args.username,
				password,
			});

			if (args.printToken) {
				console.log(authToken);
			} else {
				const config = Config.getGlobal();
				config.addToken(backendUrl, args.username, authToken);

				console.log("Successfully added token to global config");
			}

			process.exit(0);
		},
	}),
});
