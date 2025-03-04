import { ESLintUtils } from "@typescript-eslint/utils";
import { customAlphabet } from "nanoid";
export const createRule = ESLintUtils.RuleCreator(
	(_ruleName) => "" /* todo: documentation URL */,
);

export const generateId = customAlphabet(
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
	8,
);
