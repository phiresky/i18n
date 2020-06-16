import { namedParam, types } from "@hediet/cli";
import { VersionExport } from "@hediet/i18n-api";
import { readFileSync } from "fs";
import { cmdDef } from "../cli.js";
import { BackendConfig, backendParams } from "../commands-shared.js";
export const importCmd = cmdDef({
	name: "backend:import",
	description: "Imports a version.",
	namedParams: {
		...backendParams,
		in: namedParam(types.string, {}),
	},
	getData: (args) => ({
		async run() {
			const config = BackendConfig.from(args);
			const client = await config.getAuthenticatedClient();
			const data = JSON.parse(
				readFileSync(args.in, "utf8"),
			) as VersionExport;
			await client.versionApi.importVersion({
				version: config.getVersionRef(),
				import: data,
			});
			process.exit(0);
		},
	}),
});
