import { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import { checkTranslatablesRule } from "./check-translatables.js";
import { noUntranslatedTextRule } from "./no-untranslated-text.js";
import {
	ConfigWithExtends,
	InfiniteDepthConfigWithExtends,
} from "typescript-eslint";

const meta = {
	name: "@hediet/eslint-plugin-i18n",
	version: "0.6.0",
};
const rules = {
	"check-translatables": checkTranslatablesRule,
	"no-untranslated-text": noUntranslatedTextRule,
};

const plugin = {
	configs: {
		get recommended(): FlatConfig.Config {
			return recommended;
		},
	},
	meta,
	rules,
};

const recommended: FlatConfig.Config = {
	plugins: {
		"@hediet/i18n": plugin,
	},
	rules: {
		"@hediet/i18n/check-translatables": "warn",
		"@hediet/i18n/no-untranslated-text": "warn",
	},
};

export default plugin;
