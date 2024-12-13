import * as deepl from "deepl-node";
import { requireDeepLApiKey } from "../env.js";

export class DeepLTranslationService {
	private translator: deepl.Translator;

	constructor() {
		this.translator = new deepl.Translator(requireDeepLApiKey());
	}

	async translateText(
		text: string,
		targetLang: deepl.TargetLanguageCode,
		sourceLang?: deepl.SourceLanguageCode,
	): Promise<string> {
		try {
			const result = await this.translator.translateText(
				text,
				sourceLang || null,
				targetLang,
				{
					preserveFormatting: true,
				},
			);
			return Array.isArray(result) ? result[0].text : result.text;
		} catch (error) {
			console.error("DeepL translation error:", error);
			throw new Error(
				`Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async getSupportedLanguages(): Promise<readonly deepl.Language[]> {
		try {
			return await this.translator.getTargetLanguages();
		} catch (error) {
			console.error("Failed to fetch supported languages:", error);
			throw new Error("Failed to fetch supported languages");
		}
	}
}
