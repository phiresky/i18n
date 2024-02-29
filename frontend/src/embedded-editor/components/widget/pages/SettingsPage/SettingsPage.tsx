import { Button, FormGroup } from "@blueprintjs/core";
import { computed, makeObservable } from "mobx";
import { observer } from "mobx-react";
import { fromPromise } from "mobx-utils";
import * as React from "react";
import { Model } from "../../../../model";
import { pendingPromise } from "../../../../utils";
import { SimpleSelect } from "./SimpleSelect";

@observer
export class SettingsPage extends React.Component<{ model: Model }> {
	constructor(props: { model: Model }) {
		super(props);
		makeObservable(this);
	}

	@computed get orgs() {
		const observablePromise = fromPromise(
			(async () => {
				const connection = this.props.model.client.connection;
				if (!connection || !this.props.model.client.loggedIn) {
					return await pendingPromise;
				}
				const result = await connection.mainApi.getOrganizations();
				return result.orgs;
			})(),
		);
		return computed(() =>
			observablePromise.state === "fulfilled"
				? observablePromise.value
				: [],
		);
	}

	@computed get projects() {
		const settings = this.props.model.settings;

		if (!settings.organizationId) {
			return [];
		}
		const org = this.orgs
			.get()
			.find((o) => o.orgId === settings.organizationId);
		return org ? org.projects : [];
	}

	@computed get versions() {
		const settings = this.props.model.settings;

		const getPromise = async () => {
			const connection = this.props.model.client.connection;
			if (!connection || !this.props.model.client.loggedIn) {
				return await pendingPromise;
			}
			if (!settings.organizationId || !settings.projectId) {
				return [];
			}
			const result = await connection.versionApi.getVersions({
				orgId: settings.organizationId,
				projectId: settings.projectId,
			});

			return result.versions.map((v) => ({ versionId: v.id }));
		};

		const o = fromPromise(getPromise());
		return computed(() => (o.state === "fulfilled" ? o.value : []));
	}

	@computed get languages() {
		const settings = this.props.model.settings;
		const getPromise = async () => {
			const connection = this.props.model.client.connection;
			if (!connection || !this.props.model.client.loggedIn) {
				return await pendingPromise;
			}
			if (
				!settings.organizationId ||
				!settings.projectId ||
				!settings.versionId
			) {
				return [];
			}
			const result = await connection.versionApi.getVersionInfo({
				version: {
					orgId: settings.organizationId,
					projectId: settings.projectId,
					versionId: settings.versionId,
				},
			});

			return result.languages.map((v) => ({
				languageCode: v.languageCode,
				name: v.name,
			}));
		};
		const o = fromPromise(getPromise());
		return computed(() => (o.state === "fulfilled" ? o.value : []));
	}

	override render() {
		const settings = this.props.model.settings;
		return (
			<div>
				<FormGroup label="Organization">
					<SimpleSelect
						items={this.orgs.get()}
						selectedItem={this.orgs
							.get()
							.find((o) => o.orgId === settings.organizationId)}
						contentProvider={(item) => ({ text: item.orgId })}
						onSelect={(item) =>
							settings.setOrganizationId(item.orgId)
						}
					/>
				</FormGroup>
				<FormGroup label="Project">
					<SimpleSelect
						items={this.projects}
						selectedItem={this.projects.find(
							(p) => p.projectId === settings.projectId,
						)}
						onSelect={(item) =>
							settings.setProjectId(item.projectId)
						}
						contentProvider={(item) => ({ text: item.projectId })}
					/>
				</FormGroup>
				<FormGroup label="Version">
					<SimpleSelect
						items={this.versions.get()}
						selectedItem={this.versions
							.get()
							.find((v) => v.versionId === settings.versionId)}
						onSelect={(item) =>
							settings.setVersionId(item.versionId)
						}
						contentProvider={(item) => ({ text: item.versionId })}
					/>
				</FormGroup>
				<FormGroup label="Language">
					<SimpleSelect
						items={this.languages.get()}
						selectedItem={this.languages
							.get()
							.find(
								(f) => f.languageCode === settings.languageCode,
							)}
						onSelect={(item) =>
							settings.setLanguageCode(item.languageCode)
						}
						contentProvider={(item) => ({
							text: item.name,
							label: item.languageCode,
						})}
					/>
				</FormGroup>
				<div style={{ display: "flex" }}>
					<Button onClick={this.props.model.disconnect}>
						Logout
					</Button>
					<Button
						style={{ marginLeft: "auto" }}
						onClick={() =>
							(this.props.model.settingsActive = false)
						}
					>
						Close Settings
					</Button>
				</div>
			</div>
		);
	}
}
