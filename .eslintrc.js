const fs = require("fs");
const pkg = require("./package.json");
let config;

const RESTRICTED_PACKAGES = [
	"bluebird",
	"lodash",
	"lodash-es",
	// use of jquery in combination with react is basically always a bug
	"jquery",
	// moment.js is really bloated and unecessary
	"moment",
];
const RESTRICTED_PATTERNS = ["lodash/**", "lodash-es/**"];
module.exports = config = {
	parser: "@typescript-eslint/parser",

	plugins: ["@typescript-eslint", "react-hooks", "eslint-comments", "jsdoc"], //, "prettier"],
	env: {
		es6: true,
		browser: true,
		node: true,
		jest: true,
	},
	parserOptions: {
		project: true,
		tsconfigRootDir: __dirname,
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/strict",
		"plugin:@typescript-eslint/strict-type-checked",
		"plugin:react/recommended",
		"plugin:react-hooks/recommended",
		"plugin:you-dont-need-lodash-underscore/compatible-warn",
		"plugin:eslint-comments/recommended",
		"plugin:jsdoc/recommended-typescript",
		// prettier plugin is kinda annoying in vscode and format on save + the pre-commit hook fix any issues anyways
		...(process.env.PRETTIER_CHECK ? ["plugin:prettier/recommended"] : []),
	],
	rules: {
		"@typescript-eslint/naming-convention": "off",
		"@typescript-eslint/return-await": ["warn", "always"],
		"arrow-body-style": "warn",
		"jsdoc/require-param": "off",
		"jsdoc/require-returns": "off",
		"jsdoc/require-jsdoc": "off",
		"jsdoc/tag-lines": ["warn", "never", { startLines: 1 }],
		"jsdoc/empty-tags": "off",
		"jsdoc/check-tag-names": [
			"warn",
			{
				definedTags: ["public"],
			},
		],
		// https://github.com/gajus/eslint-plugin-jsdoc/issues/1169
		"jsdoc/check-param-names": "off",
		"no-console": "off",
		"no-var": "warn",
		"prefer-const": "warn",
		"no-constant-condition": "off",
		"no-inner-declarations": "off",
		"no-dupe-class-members": "off",
		"@typescript-eslint/no-invalid-void-type": [
			"warn",
			{ allowAsThisParameter: true },
		],
		"no-restricted-properties": [
			"warn",
			{
				property: "emitAsync",
				message: "use .rpc.foo(x) instead of .emitAsync('foo', x)",
			},
			{
				property: "then",
				message: "use async / await instead of .then",
			},
			{
				property: "catch",
				message:
					"use async / await + a normal try {} catch(e) block instead of .catch",
			},
		],
		"require-atomic-updates": "off", // until https://github.com/eslint/eslint/issues/11899
		"no-throw-literal": "error",
		"object-shorthand": "warn",
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/no-use-before-define": "off",
		"@typescript-eslint/prefer-interface": "off",
		"@typescript-eslint/explicit-member-accessibility": "off",
		"@typescript-eslint/explicit-module-boundary-types": "warn",
		"@typescript-eslint/no-parameter-properties": "off",
		"@typescript-eslint/no-empty-interface": "off",
		"@typescript-eslint/no-var-requires": "warn",
		"@typescript-eslint/no-non-null-assertion": "warn",
		"@typescript-eslint/no-namespace": "warn",
		"@typescript-eslint/await-thenable": "warn",
		"@typescript-eslint/no-floating-promises": "warn",
		"@typescript-eslint/no-unnecessary-condition": [
			"warn",
			{ allowConstantLoopConditions: true },
		],
		"@typescript-eslint/no-misused-promises": [
			"warn",
			{
				/**
				 * This is a compromise. this lint triggers when functions
				 * return a promise but they are used in places where that
				 * promise result is never read. that can indicate an issue, but
				 * sadly due to library design of express and often event
				 * handlers this lint has too many false positives.
				 */
				checksVoidReturn: {
					arguments: false, // primarily async functions used as callbacks
					attributes: false, // primarily async functions react event handlers
				},
			},
		],
		"@typescript-eslint/no-unnecessary-type-assertion": "warn",
		"@typescript-eslint/no-unsafe-argument": "warn",
		"@typescript-eslint/no-unsafe-assignment": "warn",
		"@typescript-eslint/no-unsafe-call": "warn",
		"@typescript-eslint/no-unsafe-member-access": "warn",
		"@typescript-eslint/no-unsafe-return": "warn",
		"@typescript-eslint/restrict-plus-operands": "warn",
		"@typescript-eslint/restrict-template-expressions": "warn",
		"@typescript-eslint/unbound-method": "warn",
		"@typescript-eslint/no-confusing-void-expression": [
			"warn",
			{ ignoreArrowShorthand: true },
		],

		"no-mixed-spaces-and-tabs": ["warn", "smart-tabs"],
		"react/self-closing-comp": "off", // this should be turned on for entire-codebase and set to error
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{
				vars: "all",
				args: "after-used",
				varsIgnorePattern: "^_.",
				argsIgnorePattern: "^_",
			},
		],
		"react/display-name": "off",
		"react/no-unescaped-entities": "off",
		"react/prop-types": 0,
		"react/jsx-no-target-blank": ["warn", { allowReferrer: true }],
		// require reasoning for new code
		"eslint-comments/require-description": ["error", { ignore: [] }],
		"eslint-comments/no-use": [
			"error",
			// don't allow file-wide rule ignores
			{ allow: ["eslint-disable-line", "eslint-disable-next-line"] },
		],
	},
	ignorePatterns: [
		"node_modules",
		"notes",
		"logs",
		"/util/dbStats/build",
		"tools/www/stats",
		"client/admin/AdminBlog/util/index.ts",
		".eslintrc.js",
		"client/shared/client-build",
		"server/common/migrations/2023-11-07-fill-senders-address.ts",
		"client/webpack.config.ts",
		"client/vendor/amcharts/custom.ts",
	],
	settings: {
		react: {
			version: "detect",
		},
	},
};
