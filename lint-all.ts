import { spawnSync } from "child_process";
import { ESLint, Linter } from "eslint";
import * as path from "path";
import * as ghActions from "@actions/core";

type Allowed = { [fname: string]: { [rule: string]: number } };
type LineError = {
	filepath: string;
	rule: string;
	message: string;
	detail: Linter.LintMessage;
};
export function checkErrorCount(allowed: Allowed, errors: LineError[]): void {
	const mode = (process.env.lmode || "check") as "collect" | "check";
	if (mode === "collect")
		Object.keys(allowed).forEach((k) => delete allowed[k]);
	let foundErrors = 0;
	const totalAllowed = Object.values(allowed)
		.flatMap((o) => Object.values(o))
		.reduce((a, b) => a + b, 0);
	for (const { filepath, rule, message, detail } of errors) {
		const fallowed = allowed[filepath] || (allowed[filepath] = {});

		fallowed[rule] = fallowed[rule] || 0;
		if (mode === "collect") fallowed[rule]++;
		else {
			if (fallowed[rule] <= 0) {
				console.error(message);

				if (process.env.GITHUB_ACTIONS) {
					// https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
					ghActions.warning(detail.message, {
						file: filepath,
						title: rule,
						startLine: detail.line,
						endLine: detail.endLine,
						startColumn: detail.column,
						endColumn: detail.endColumn,
					});
				}
				foundErrors++;
			}
			fallowed[rule]--;
		}
	}
	if (mode === "collect") {
		console.log(allowed);
	} else {
		console.error(
			`${errors.length} total lint issues, ${totalAllowed} whitelisted due to legacy code`,
		);
		if (foundErrors > 0) {
			console.error(`Found ${foundErrors} errors`);

			process.exitCode = 1;
		}
	}
}

const ran = spawnSync("git", ["ls-files", "*.js", "*.ts", "*.tsx"], {
	encoding: "utf8",
});
if (ran.error) throw ran.error;
let list = ran.stdout.trim().split("\n");

console.warn("linting", list.length, "files");

// for legacy code. do not add anything here, only remove it
const allowed: Allowed = {
	"i18n/backend/src/HttpServer.ts": {
		"@typescript-eslint/no-non-null-assertion": 2,
		"@typescript-eslint/no-explicit-any": 3,
		"@typescript-eslint/no-unnecessary-type-arguments": 2,
		"@typescript-eslint/restrict-template-expressions": 2,
		"@typescript-eslint/no-unused-vars": 3,
	},
	"i18n/backend/src/db/entities/OrganizationEntity.ts": {
		"@typescript-eslint/no-unused-vars": 2,
	},
	"i18n/backend/src/db/entities/OrganizationMembershipEntity.ts": {
		"@typescript-eslint/no-unused-vars": 2,
	},
	"i18n/backend/src/db/entities/ProjectEntity.ts": {
		"@typescript-eslint/no-unused-vars": 2,
	},
	"i18n/backend/src/db/entities/TokenEntity.ts": {
		"@typescript-eslint/no-unused-vars": 1,
	},
	"i18n/backend/src/db/entities/TranslatableFormatEntity.ts": {
		"@typescript-eslint/no-unused-vars": 2,
	},
	"i18n/backend/src/db/entities/TranslatedFormatEntity.ts": {
		"@typescript-eslint/no-unused-vars": 2,
	},
	"i18n/backend/src/db/entities/UserEntity.ts": {
		"@typescript-eslint/no-unused-vars": 2,
	},
	"i18n/backend/src/db/entities/VersionEntity.ts": {
		"@typescript-eslint/restrict-template-expressions": 1,
		"@typescript-eslint/no-unused-vars": 6,
	},
	"i18n/backend/src/db/entities/VersionLanguageEntity.ts": {
		"@typescript-eslint/no-unused-vars": 2,
	},
	"i18n/backend/src/db/facade/BaseVersionFacade.ts": {
		"@typescript-eslint/no-unnecessary-condition": 2,
	},
	"i18n/backend/src/db/facade/MainFacade.ts": {
		"object-shorthand": 1,
		"@typescript-eslint/only-throw-error": 1,
	},
	"i18n/backend/src/db/facade/VersionFacade.ts": {
		"@typescript-eslint/no-non-null-assertion": 6,
		"@typescript-eslint/only-throw-error": 2,
		"@typescript-eslint/no-unused-vars": 1,
		"@typescript-eslint/no-unnecessary-condition": 6,
	},
	"i18n/backend/src/db/facade/VersionTranslationsFacade.ts": {
		"@typescript-eslint/no-non-null-assertion": 4,
		"@typescript-eslint/no-unused-vars": 1,
	},
	"i18n/backend/src/db/migration/1594044623054-Migration.ts": {
		"@typescript-eslint/no-non-null-assertion": 1,
	},
	"i18n/backend/src/index.ts": { "@typescript-eslint/no-unused-vars": 1 },
	"i18n/backend/src/utils/other.ts": {
		"@typescript-eslint/no-unnecessary-type-parameters": 1,
		"@typescript-eslint/no-explicit-any": 2,
	},
	"i18n/backend/src/websocketHandler.ts": {
		"@typescript-eslint/no-non-null-assertion": 1,
		"@typescript-eslint/explicit-module-boundary-types": 1,
		"no-empty-pattern": 5,
		"@typescript-eslint/no-invalid-void-type": 2,
		"arrow-body-style": 5,
		"@typescript-eslint/no-unused-vars": 17,
		"@typescript-eslint/no-confusing-void-expression": 1,
		"@typescript-eslint/only-throw-error": 2,
		"@typescript-eslint/unbound-method": 1,
	},
	"i18n/backend/src/windows-entry.ts": {
		"eslint-comments/require-description": 5,
		"eslint-comments/no-use": 4,
		"eslint-comments/disable-enable-pair": 4,
		"eslint-comments/no-unlimited-disable": 1,
		"@typescript-eslint/no-explicit-any": 1,
	},
	"i18n/eslint-plugin-i18n/src/check-translatables.ts": {
		"@typescript-eslint/no-non-null-assertion": 1,
	},
	"i18n/eslint-plugin-i18n/src/index.ts": {
		"@typescript-eslint/no-unused-vars": 2,
	},
	"i18n/eslint-plugin-i18n/src/no-untranslated-text.ts": {
		"@typescript-eslint/restrict-template-expressions": 1,
		"@typescript-eslint/no-deprecated": 1,
	},
	"i18n/frontend-lib/src/EmbeddedTranslationEditorService.ts": {
		"no-restricted-properties": 1,
	},
	"i18n/frontend-lib/src/I18nService.ts": {
		"@typescript-eslint/no-non-null-assertion": 1,
		"no-restricted-properties": 2,
		"@typescript-eslint/no-explicit-any": 1,
	},
	"i18n/frontend-lib/src/Translatable.tsx": {
		"@typescript-eslint/no-redundant-type-constituents": 1,
	},
	"i18n/frontend-lib/src/data.ts": {
		"@typescript-eslint/no-unnecessary-condition": 1,
	},
	"i18n/frontend-lib/src/formatting.ts": {
		"@typescript-eslint/no-explicit-any": 2,
	},
	"i18n/frontend-lib/src/geml-evaluation.tsx": {
		"@typescript-eslint/no-unnecessary-condition": 1,
		"@typescript-eslint/no-unnecessary-template-expression": 1,
		"@typescript-eslint/no-base-to-string": 1,
	},
	"i18n/frontend-lib/src/react.tsx": {
		"@typescript-eslint/no-non-null-assertion": 1,
		"arrow-body-style": 1,
		"@typescript-eslint/no-explicit-any": 2,
	},
	"i18n/frontend-lib/src/utils.ts": {
		"@typescript-eslint/no-explicit-any": 1,
	},
	"i18n/frontend/src/common/Flag.tsx": {
		"@typescript-eslint/explicit-module-boundary-types": 1,
	},
	"i18n/frontend/src/common/hediet-router/LocationInfo.ts": {
		"@typescript-eslint/no-deprecated": 1,
		"@typescript-eslint/no-explicit-any": 1,
	},
	"i18n/frontend/src/common/hediet-router/Route.ts": {
		"@typescript-eslint/no-empty-object-type": 5,
		"@typescript-eslint/no-non-null-assertion": 1,
		"@typescript-eslint/no-unnecessary-type-arguments": 2,
		"@typescript-eslint/no-unused-vars": 1,
		"@typescript-eslint/no-explicit-any": 1,
	},
	"i18n/frontend/src/common/hediet-router/Router.ts": {
		"@typescript-eslint/no-empty-object-type": 3,
		"@typescript-eslint/no-explicit-any": 4,
	},
	"i18n/frontend/src/common/hediet-router/Routes.tsx": {
		"@typescript-eslint/explicit-module-boundary-types": 1,
		"@typescript-eslint/no-explicit-any": 2,
	},
	"i18n/frontend/src/common/hediet-router/Routing.ts": {
		"@typescript-eslint/no-explicit-any": 8,
		"@typescript-eslint/explicit-module-boundary-types": 1,
	},
	"i18n/frontend/src/common/hediet-super-scrollview/MeasuredDiv.tsx": {
		"@typescript-eslint/explicit-module-boundary-types": 4,
		"@typescript-eslint/no-non-null-assertion": 1,
		"@typescript-eslint/no-unnecessary-condition": 1,
	},
	"i18n/frontend/src/common/hediet-super-scrollview/OffsetScrollView.tsx": {
		"@typescript-eslint/explicit-module-boundary-types": 2,
		"@typescript-eslint/no-non-null-assertion": 3,
		"@typescript-eslint/no-unnecessary-condition": 1,
	},
	"i18n/frontend/src/common/hediet-super-scrollview/ResizeObserver.d.ts": {
		"jsdoc/tag-lines": 3,
	},
	"i18n/frontend/src/common/hediet-super-scrollview/SuperScrollView.tsx": {
		"@typescript-eslint/explicit-module-boundary-types": 1,
	},
	"i18n/frontend/src/common/hotComponent.tsx": {
		"@typescript-eslint/no-explicit-any": 2,
		"object-shorthand": 1,
		"@typescript-eslint/no-non-null-assertion": 2,
	},
	"i18n/frontend/src/embedded-editor/ResizeObserver.d.ts": {
		"jsdoc/tag-lines": 3,
	},
	"i18n/frontend/src/embedded-editor/components/App.tsx": {
		"@typescript-eslint/explicit-module-boundary-types": 1,
	},
	"i18n/frontend/src/embedded-editor/components/MainView.tsx": {
		"@typescript-eslint/no-empty-object-type": 1,
		"@typescript-eslint/explicit-module-boundary-types": 1,
	},
	"i18n/frontend/src/embedded-editor/components/VisibleTranslationFinder.ts":
		{
			"@typescript-eslint/explicit-module-boundary-types": 2,
			"@typescript-eslint/no-non-null-assertion": 2,
			"@typescript-eslint/no-unused-expressions": 2,
		},
	"i18n/frontend/src/embedded-editor/components/widget/Widget.tsx": {
		"@typescript-eslint/explicit-module-boundary-types": 1,
		"@typescript-eslint/unbound-method": 3,
	},
	"i18n/frontend/src/embedded-editor/components/widget/pages/ConnectPage/ConnectPage.tsx":
		{ "@typescript-eslint/explicit-module-boundary-types": 1 },
	"i18n/frontend/src/embedded-editor/components/widget/pages/SettingsPage/SettingsPage.tsx":
		{
			"@typescript-eslint/explicit-module-boundary-types": 5,
			"@typescript-eslint/unbound-method": 1,
		},
	"i18n/frontend/src/embedded-editor/components/widget/pages/SettingsPage/SimpleSelect.tsx":
		{
			"@typescript-eslint/explicit-module-boundary-types": 1,
			"@typescript-eslint/no-deprecated": 1,
		},
	"i18n/frontend/src/embedded-editor/components/widget/pages/TranslationPage/TranslationEntry.tsx":
		{
			"@typescript-eslint/no-non-null-assertion": 1,
			"eslint-comments/require-description": 1,
			"@typescript-eslint/no-unused-expressions": 1,
			"@typescript-eslint/explicit-module-boundary-types": 1,
			"@typescript-eslint/no-deprecated": 1,
		},
	"i18n/frontend/src/embedded-editor/components/widget/pages/TranslationPage/TranslationPage.tsx":
		{
			"@typescript-eslint/explicit-module-boundary-types": 1,
			"@typescript-eslint/no-non-null-assertion": 2,
		},
	"i18n/frontend/src/embedded-editor/index.tsx": { "react/no-deprecated": 1 },
	"i18n/frontend/src/embedded-editor/model/I18nClient.ts": {
		"@typescript-eslint/no-unused-vars": 1,
		"@typescript-eslint/explicit-module-boundary-types": 1,
		"@typescript-eslint/no-non-null-assertion": 2,
	},
	"i18n/frontend/src/embedded-editor/model/Model.ts": {
		"@typescript-eslint/explicit-module-boundary-types": 2,
		"eslint-comments/require-description": 2,
		"@typescript-eslint/no-explicit-any": 2,
		"@typescript-eslint/no-non-null-assertion": 3,
	},
	"i18n/frontend/src/embedded-editor/model/Translations.ts": {
		"arrow-body-style": 1,
		"@typescript-eslint/no-non-null-assertion": 4,
	},
	"i18n/frontend/src/embedded-editor/utils/DragBehavior.ts": {
		"no-restricted-properties": 2,
		"@typescript-eslint/explicit-module-boundary-types": 2,
		"@typescript-eslint/no-explicit-any": 1,
		"eslint-comments/require-description": 1,
		"@typescript-eslint/no-unused-vars": 1,
		"@typescript-eslint/no-non-null-assertion": 1,
	},
	"i18n/frontend/src/embedded-editor/utils/Point.ts": {
		"@typescript-eslint/explicit-module-boundary-types": 2,
		"jsdoc/no-types": 6,
		"jsdoc/require-param-description": 5,
		"jsdoc/check-types": 3,
		"jsdoc/require-returns-description": 1,
		"jsdoc/check-tag-names": 1,
	},
	"i18n/frontend/src/embedded-editor/utils/hotComponent.tsx": {
		"@typescript-eslint/no-explicit-any": 1,
		"@typescript-eslint/no-unused-vars": 1,
	},
	"i18n/frontend/src/frontend/components/App.tsx": {
		"@typescript-eslint/explicit-module-boundary-types": 1,
	},
	"i18n/frontend/src/frontend/components/ChangePasswordDialog.tsx": {
		"@typescript-eslint/explicit-module-boundary-types": 1,
	},
	"i18n/frontend/src/frontend/components/CustomMultiSelect.tsx": {
		"@typescript-eslint/explicit-module-boundary-types": 1,
		"@typescript-eslint/no-deprecated": 1,
		"@typescript-eslint/no-unused-vars": 1,
	},
	"i18n/frontend/src/frontend/components/MainView.tsx": {
		"@typescript-eslint/no-empty-object-type": 1,
		"@typescript-eslint/explicit-module-boundary-types": 1,
	},
	"i18n/frontend/src/frontend/components/PageLayout.tsx": {
		"@typescript-eslint/no-empty-object-type": 1,
		"@typescript-eslint/no-non-null-assertion": 2,
		"@typescript-eslint/explicit-module-boundary-types": 1,
		"@typescript-eslint/no-deprecated": 1,
		"@typescript-eslint/unbound-method": 2,
	},
	"i18n/frontend/src/frontend/components/pages/ExperimentalPage/CustomEditor/DocumentModel.tsx":
		{
			"@typescript-eslint/explicit-module-boundary-types": 1,
			"@typescript-eslint/no-unnecessary-condition": 1,
		},
	"i18n/frontend/src/frontend/components/pages/ExperimentalPage/CustomEditor/DocumentViewModel.tsx":
		{
			"@typescript-eslint/no-unused-vars": 1,
			"@typescript-eslint/no-non-null-assertion": 2,
			"object-shorthand": 1,
			"@typescript-eslint/explicit-module-boundary-types": 1,
			"@typescript-eslint/no-unnecessary-condition": 1,
		},
	"i18n/frontend/src/frontend/components/pages/ExperimentalPage/CustomEditor/index.tsx":
		{
			"eslint-comments/require-description": 3,
			"eslint-comments/no-use": 3,
			"eslint-comments/disable-enable-pair": 3,
			"@typescript-eslint/no-deprecated": 4,
			"@typescript-eslint/no-non-null-assertion": 2,
			"@typescript-eslint/no-explicit-any": 7,
			"@typescript-eslint/explicit-module-boundary-types": 3,
			"@typescript-eslint/no-unused-vars": 7,
		},
	"i18n/frontend/src/frontend/components/pages/ExperimentalPage/CustomEditor/renderElement.tsx":
		{
			"@typescript-eslint/explicit-module-boundary-types": 2,
			"@typescript-eslint/no-non-null-assertion": 2,
			"eslint-comments/require-description": 3,
			"eslint-comments/no-unlimited-disable": 3,
		},
	"i18n/frontend/src/frontend/components/pages/ExperimentalPage/index.tsx": {
		"@typescript-eslint/explicit-module-boundary-types": 3,
	},
	"i18n/frontend/src/frontend/components/pages/LoginPage.tsx": {
		"@typescript-eslint/no-empty-object-type": 1,
		"@typescript-eslint/explicit-module-boundary-types": 2,
		"@typescript-eslint/no-non-null-assertion": 1,
	},
	"i18n/frontend/src/frontend/components/pages/OrganizationSettingsPage/NewMemberDialog.tsx":
		{ "@typescript-eslint/explicit-module-boundary-types": 1 },
	"i18n/frontend/src/frontend/components/pages/OrganizationSettingsPage/OrganizationSettingsModel.tsx":
		{
			"@typescript-eslint/explicit-module-boundary-types": 1,
			"@typescript-eslint/no-unused-expressions": 1,
			"@typescript-eslint/no-non-null-assertion": 3,
		},
	"i18n/frontend/src/frontend/components/pages/OrganizationSettingsPage/OrganizationSettingsPage.tsx":
		{
			"@typescript-eslint/no-empty-object-type": 1,
			"@typescript-eslint/explicit-module-boundary-types": 1,
			"object-shorthand": 1,
			"@typescript-eslint/unbound-method": 1,
			"@typescript-eslint/no-unused-vars": 2,
		},
	"i18n/frontend/src/frontend/components/pages/OrganizationsPage/DeleteDialog.tsx":
		{
			"@typescript-eslint/no-deprecated": 1,
			"@typescript-eslint/explicit-module-boundary-types": 1,
		},
	"i18n/frontend/src/frontend/components/pages/OrganizationsPage/NewOrganizationDialog.tsx":
		{ "@typescript-eslint/explicit-module-boundary-types": 1 },
	"i18n/frontend/src/frontend/components/pages/OrganizationsPage/NewProjectDialog.tsx":
		{ "@typescript-eslint/explicit-module-boundary-types": 1 },
	"i18n/frontend/src/frontend/components/pages/OrganizationsPage/NewUserDialog.tsx":
		{ "@typescript-eslint/explicit-module-boundary-types": 1 },
	"i18n/frontend/src/frontend/components/pages/OrganizationsPage/OrganizationsPage.tsx":
		{
			"@typescript-eslint/explicit-module-boundary-types": 8,
			"@typescript-eslint/no-unused-expressions": 2,
			"@typescript-eslint/no-non-null-assertion": 7,
			"object-shorthand": 1,
			"@typescript-eslint/no-empty-object-type": 1,
			"@typescript-eslint/unbound-method": 2,
			"@typescript-eslint/no-unused-vars": 4,
		},
	"i18n/frontend/src/frontend/components/pages/ProjectPage/DeleteVersionDialog.tsx":
		{
			"@typescript-eslint/explicit-module-boundary-types": 1,
			"@typescript-eslint/unbound-method": 1,
			"@typescript-eslint/no-non-null-assertion": 1,
		},
	"i18n/frontend/src/frontend/components/pages/ProjectPage/ProjectPage.tsx": {
		"@typescript-eslint/no-empty-object-type": 1,
		"@typescript-eslint/explicit-module-boundary-types": 4,
		"@typescript-eslint/no-unused-expressions": 1,
		"@typescript-eslint/no-non-null-assertion": 1,
		"object-shorthand": 2,
		"@typescript-eslint/no-unused-vars": 2,
	},
	"i18n/frontend/src/frontend/components/pages/VersionPage/PackageHeaderItem.tsx":
		{ "@typescript-eslint/explicit-module-boundary-types": 1 },
	"i18n/frontend/src/frontend/components/pages/VersionPage/TranslatableItem.tsx":
		{ "@typescript-eslint/explicit-module-boundary-types": 1 },
	"i18n/frontend/src/frontend/components/pages/VersionPage/TranslationEntry.tsx":
		{
			"@typescript-eslint/explicit-module-boundary-types": 1,
			"@typescript-eslint/no-unnecessary-condition": 1,
			"@typescript-eslint/no-deprecated": 2,
			"@typescript-eslint/unbound-method": 1,
		},
	"i18n/frontend/src/frontend/components/pages/VersionPage/VersionPage.tsx": {
		"@typescript-eslint/no-empty-object-type": 1,
		"@typescript-eslint/explicit-module-boundary-types": 2,
		"@typescript-eslint/no-non-null-assertion": 1,
		"@typescript-eslint/restrict-template-expressions": 2,
		"@typescript-eslint/no-unused-vars": 2,
	},
	"i18n/frontend/src/frontend/components/pages/VersionPage/VersionPageModel.tsx":
		{
			"@typescript-eslint/explicit-module-boundary-types": 1,
			"no-restricted-properties": 1,
			"@typescript-eslint/no-unused-vars": 4,
		},
	"i18n/frontend/src/frontend/components/pages/VersionSettingsPage/AddNewLanguageDialog.tsx":
		{ "@typescript-eslint/explicit-module-boundary-types": 1 },
	"i18n/frontend/src/frontend/components/pages/VersionSettingsPage/DeleteLanguageConfirmationDialog.tsx":
		{ "@typescript-eslint/explicit-module-boundary-types": 1 },
	"i18n/frontend/src/frontend/components/pages/VersionSettingsPage/LangCard.tsx":
		{ "@typescript-eslint/no-non-null-assertion": 1 },
	"i18n/frontend/src/frontend/components/pages/VersionSettingsPage/VersionSettingsPage.tsx":
		{
			"@typescript-eslint/no-non-null-assertion": 2,
			"object-shorthand": 1,
			"@typescript-eslint/explicit-module-boundary-types": 1,
			"@typescript-eslint/unbound-method": 1,
		},
	"i18n/frontend/src/frontend/components/pages/VersionSettingsPage/VersionSettingsPageModel.tsx":
		{
			"@typescript-eslint/explicit-module-boundary-types": 3,
			"@typescript-eslint/no-unused-expressions": 1,
			"no-restricted-properties": 1,
			"@typescript-eslint/no-non-null-assertion": 2,
		},
	"i18n/frontend/src/frontend/components/router.tsx": {
		"@typescript-eslint/no-unused-vars": 3,
	},
	"i18n/frontend/src/frontend/index.tsx": { "react/no-deprecated": 1 },
	"i18n/frontend/src/frontend/model/index.ts": {
		"@typescript-eslint/no-unused-vars": 1,
		"@typescript-eslint/explicit-module-boundary-types": 1,
		"@typescript-eslint/no-unnecessary-condition": 2,
	},
	"i18n/frontend/src/frontend/model/service.ts": {
		"@typescript-eslint/no-extraneous-class": 1,
	},
	"i18n/frontend/src/types.d.ts": { "@typescript-eslint/no-explicit-any": 1 },
	"i18n/i18n-api/src/I18nConnection.ts": {
		"@typescript-eslint/no-deprecated": 1,
		"no-restricted-properties": 1,
	},
	"i18n/i18n-cli/src/FileEditor.ts": {
		"@typescript-eslint/explicit-module-boundary-types": 1,
	},
	"i18n/i18n-cli/src/GlobalConfig.ts": {
		"eslint-comments/require-description": 3,
	},
	"i18n/i18n-cli/src/cli.ts": {
		"@typescript-eslint/explicit-module-boundary-types": 1,
		"@typescript-eslint/no-empty-object-type": 2,
	},
	"i18n/i18n-cli/src/commands/export.ts": {
		"@typescript-eslint/explicit-module-boundary-types": 1,
		"@typescript-eslint/no-unnecessary-condition": 1,
	},
	"i18n/i18n-cli/src/commands/logout.ts": {
		"eslint-comments/require-description": 1,
	},
	"i18n/i18n-cli/src/commands/mergeDuplicates.ts": {
		"eslint-comments/require-description": 1,
		"@typescript-eslint/restrict-template-expressions": 2,
	},
	"i18n/i18n-cli/src/commands/sync.ts": {
		"@typescript-eslint/restrict-template-expressions": 1,
		"arrow-body-style": 1,
		"@typescript-eslint/no-non-null-assertion": 3,
	},
	"i18n/i18n-cli/src/model.ts": { "object-shorthand": 1 },
	"i18n/i18n-cli/src/types.d.ts": { "@typescript-eslint/no-explicit-any": 1 },
	"i18n/i18n-static-analysis/src/static-analysis.ts": {
		"@typescript-eslint/no-unnecessary-condition": 1,
	},
	"i18n/i18n-static-analysis/src/ts-utils/helper.ts": {
		"@typescript-eslint/unbound-method": 4,
		"@typescript-eslint/no-unnecessary-type-parameters": 1,
		"@typescript-eslint/no-unused-vars": 2,
		"eslint-comments/require-description": 2,
		"@typescript-eslint/no-explicit-any": 2,
	},
	"i18n/ts-api-extras/src/EditBuilder.ts": { "object-shorthand": 1 },
	"i18n/ts-api-extras/src/PatternMatching.ts": {
		"@typescript-eslint/no-explicit-any": 21,
		"@typescript-eslint/no-unnecessary-type-parameters": 1,
		"@typescript-eslint/restrict-template-expressions": 1,
		"@typescript-eslint/no-unnecessary-condition": 2,
		"@typescript-eslint/no-empty-object-type": 5,
		"@typescript-eslint/explicit-module-boundary-types": 1,
		"eslint-comments/require-description": 8,
		"@typescript-eslint/no-non-null-assertion": 4,
		"@typescript-eslint/no-unnecessary-template-expression": 1,
		"arrow-body-style": 2,
		"@typescript-eslint/no-unused-vars": 1,
		"@typescript-eslint/no-unsafe-function-type": 1,
		"eslint-comments/no-unlimited-disable": 1,
	},
	"i18n/ts-api-extras/src/VirtualLanguageServiceHost.ts": {
		"@typescript-eslint/no-unused-vars": 4,
		"@typescript-eslint/no-duplicate-type-constituents": 1,
		"@typescript-eslint/no-deprecated": 1,
	},
	"i18n/ts-api-extras/src/test-utils.ts": {
		"@typescript-eslint/no-non-null-assertion": 3,
		"@typescript-eslint/no-unused-expressions": 3,
		"@typescript-eslint/no-deprecated": 2,
	},
	"i18n/vscode-extension/src/MakeTranslatable.ts": {
		"@typescript-eslint/no-var-requires": 1,
		"@typescript-eslint/no-require-imports": 1,
		"@typescript-eslint/explicit-module-boundary-types": 1,
		"eslint-comments/require-description": 1,
		"@typescript-eslint/no-explicit-any": 1,
		"@typescript-eslint/no-deprecated": 3,
		"@typescript-eslint/no-unnecessary-condition": 1,
		"@typescript-eslint/restrict-template-expressions": 1,
		"@typescript-eslint/no-unnecessary-template-expression": 1,
	},
	"i18n/vscode-extension/src/TsHelper.ts": {
		"@typescript-eslint/no-unnecessary-condition": 1,
	},
	"i18n/vscode-extension/src/extension.ts": {
		"@typescript-eslint/restrict-template-expressions": 1,
	},
};

const exclude = [
	"backend/ormconfig.ts",
	"frontend/embedded-editor.js",
	"frontend/index.d.ts",
	"frontend/index.js",
	"frontend/webpack.config.ts",
	"lint-all.ts",
	"vscode-extension/webpack.config.js",
	"vscode-extension/webpack.config.ts",
];

// remove excluded from list
list = list.filter((f) => !exclude.includes(f));

async function main() {
	const cli = new ESLint({
		useEslintrc: false,
		baseConfig: (await import("./.eslintrc.js" as string))
			.default as Linter.Config,
	});
	const errors: LineError[] = [];
	for (const file of await cli.lintFiles(list)) {
		const filepath = path.relative(
			path.join(__dirname, ".."),
			file.filePath,
		);
		for (const msg of file.messages) {
			const rule = msg.ruleId;
			if (!rule) {
				if (msg.severity > 1) console.log(filepath, msg.message);
				continue;
			}
			const message = `${filepath}:${msg.line}:${msg.column} ${rule}: ${msg.message}`;
			errors.push({ filepath, rule, message, detail: msg });
		}
	}
	checkErrorCount(allowed, errors);
}
void main();
