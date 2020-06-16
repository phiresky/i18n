import { I18nConnection } from "@hediet/i18n-api";
import { Config } from "./GlobalConfig.js";

export async function getAuthenticatedClient(
	serverUrl: string,
	token: string | undefined,
): Promise<I18nConnection> {
	let authToken = token;
	if (!authToken) {
		const config = Config.getGlobal();
		authToken = config.findToken(serverUrl);
	}

	if (!authToken) {
		throw new Error("No auth token given! Login first!");
	}

	const client = await I18nConnection.connectTo(serverUrl);
	try {
		await client.authApi.authenticate({ authToken });
	} catch (e) {
		if ((e as { code?: number }).code === -32000) {
			throw new Error("Not logged in!");
		}
		throw e;
	}

	return client;
}
