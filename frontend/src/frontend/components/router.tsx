import * as React from "react";
import { asQueryArgs, Route } from "../../common/hediet-router";
import { Router } from "../../common/hediet-router/Router";
import { Model } from "../model";
import { ExperimentalPage } from "./pages/ExperimentalPage";
import { LoginPage } from "./pages/LoginPage";
import { OrganizationSettingsPage } from "./pages/OrganizationSettingsPage/OrganizationSettingsPage";
import { OrganizationsPage } from "./pages/OrganizationsPage/OrganizationsPage";
import { ProjectPage } from "./pages/ProjectPage/ProjectPage";
import { VersionPage } from "./pages/VersionPage/VersionPage";
import { VersionSettingsPage } from "./pages/VersionSettingsPage/VersionSettingsPage";

const rootQueryArgs = asQueryArgs({
	serverUrl: "string",
});

export const mainRoute = Route.create("/").withQueryArgs(rootQueryArgs);
export const loginRoute = Route.create("/login").withQueryArgs(rootQueryArgs);
export const projectRoute = Route.create("/orgs/:orgId/projects/:projectId", {
	orgId: "string",
	projectId: "string",
}).withQueryArgs(rootQueryArgs);
export const orgSettingsRoute = Route.create("/orgs/:orgId/settings", {
	orgId: "string",
}).withQueryArgs(rootQueryArgs);

export const versionRoute = Route.create(
	"/orgs/:orgId/projects/:projectId/versions/:versionId",
	{
		orgId: "string",
		projectId: "string",
		versionId: "string",
	},
).withQueryArgs(rootQueryArgs);

export const versionSettingsRoute = Route.create(
	"/orgs/:orgId/projects/:projectId/versions/:versionId/settings",
	{
		orgId: "string",
		projectId: "string",
		versionId: "string",
	},
).withQueryArgs(rootQueryArgs);

export const experimentalRoute = Route.create(
	"/internal/experiments",
	{},
).withQueryArgs(rootQueryArgs);

export interface Page {
	getContent: (model: Model) => React.ReactNode;
}

export const router = Router.create<Page>()
	.with(experimentalRoute, () => ({
		getContent: () => <ExperimentalPage />,
	}))
	.with(mainRoute, () => ({
		getContent: (model) => <OrganizationsPage model={model} />,
	}))
	.with(orgSettingsRoute, ({ args }) => ({
		getContent: (model) => (
			<OrganizationSettingsPage orgId={args.orgId} model={model} />
		),
	}))
	.with(loginRoute, () => ({
		getContent: (model) => <LoginPage model={model} />,
	}))
	.with(
		projectRoute,
		({ args: { orgId: org, projectId: project }, queryArgs }) => ({
			getContent: (model) => (
				<ProjectPage orgId={org} projectId={project} model={model} />
			),
		}),
	)
	.with(
		versionRoute,
		({ args: { orgId, projectId, versionId }, queryArgs }) => ({
			getContent: (model) => (
				<VersionPage
					version={{ orgId, projectId, versionId }}
					model={model}
				/>
			),
		}),
	)
	.with(
		versionSettingsRoute,
		({ args: { orgId, projectId, versionId }, queryArgs }) => ({
			getContent: (model) => (
				<VersionSettingsPage
					version={{ orgId, projectId, versionId }}
					model={model}
				/>
			),
		}),
	);
