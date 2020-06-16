import { sArrayOf, sObject, sString } from "@hediet/semantic-json";
import envPaths from "env-paths";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { mkdirSync } from "mkdir-recursive";
import { join } from "path";

const globalConfig = sObject({
	tokens: sArrayOf(
		sObject({
			serverUrl: sString(),
			token: sString(),
			username: sString(),
		}),
	),
});

export class Config {
	public static getGlobal(): Config {
		return new Config(getGlobalConfigPath());
	}

	constructor(private readonly filePath: string) {}

	private readData(): typeof globalConfig.T {
		if (!existsSync(this.filePath)) {
			return {
				tokens: [],
			};
		}
		const content = readFileSync(this.filePath, { encoding: "utf-8" });
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const json = JSON.parse(content);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const result = globalConfig.deserialize(json);
		if (result.hasErrors) {
			throw new Error(result.formatError());
		}
		return result.value;
	}

	private writeData(data: typeof globalConfig.T): void {
		const json = JSON.stringify(globalConfig.serialize(data), null, 2);
		writeFileSync(this.filePath, json, { encoding: "utf-8" });
	}

	public deleteToken(serverUrl: string): boolean {
		const data = this.readData();
		const len = data.tokens.length;
		data.tokens = data.tokens.filter((t) => t.serverUrl !== serverUrl);
		this.writeData(data);
		return data.tokens.length !== len;
	}

	public findToken(serverUrl: string): string | undefined {
		const token = this.readData().tokens.find(
			(t) => t.serverUrl === serverUrl,
		);
		if (token) {
			return token.token;
		}
		return undefined;
	}

	public addToken(serverUrl: string, username: string, token: string): void {
		const data = this.readData();
		data.tokens = data.tokens.filter((t) => t.serverUrl !== serverUrl);
		data.tokens.push({ serverUrl, username, token });
		this.writeData(data);
	}
}

function getGlobalConfigPath(): string {
	const paths = envPaths("hediet-i18n-cli");
	const path = paths.config;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	mkdirSync(path);
	return join(path, "config.json");
}
