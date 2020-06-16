import {
	cliInfoFromPackageJson,
	createDefaultCli,
	runDefaultCli,
} from "@hediet/cli";
import { join } from "path";
import { loginCmd } from "./commands/login.js";
import { mergeDuplicatesCmd } from "./commands/mergeDuplicates.js";
import { backendSyncCmd } from "./commands/sync.js";
import { exportCmd } from "./commands/export.js";
import { importCmd } from "./commands/import.js";
import { logoutCmd } from "./commands/logout.js";

// An arbitrary type.
interface CmdData {
	run(): Promise<void>;
}

const cli = createDefaultCli<CmdData>()
	// Defines a command with name `print`
	.addCmd(backendSyncCmd)
	.addCmd(mergeDuplicatesCmd)
	.addCmd(exportCmd)
	.addCmd(importCmd)
	.addCmd(loginCmd)
	.addCmd(logoutCmd);

runDefaultCli({
	info: cliInfoFromPackageJson(
		join(
			(import.meta as unknown as { dirname: string }).dirname,
			"../package.json",
		),
	),
	cli,
	dataHandler: (data) => data.run(),
});
