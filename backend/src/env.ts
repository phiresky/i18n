export function isProduction(): boolean {
	return !isDev();
}

export function isDev(): boolean {
	return process.env["NODE_ENV"] === "development";
}

export function getDeepLApiKey(): string | undefined {
	return process.env["DEEPL_API_KEY"];
}

export function requireDeepLApiKey(): string {
	const key = getDeepLApiKey();
	if (!key) {
		throw new Error("DEEPL_API_KEY environment variable is required");
	}
	return key;
}
