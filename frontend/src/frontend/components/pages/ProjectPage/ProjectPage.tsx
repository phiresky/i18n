import { AnchorButton, Button, Card, Elevation, Icon } from "@blueprintjs/core";
import { sVersionInfo } from "@hediet/i18n-api";
import { action, computed, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import { fromPromise } from "mobx-utils";
import * as React from "react";
import { pendingPromise } from "../../../../common/pendingPromise";
import { Model } from "../../../model";
import { PageLayout } from "../../PageLayout";
import { projectRoute, versionRoute, versionSettingsRoute } from "../../router";
import { DeleteVersionDialog } from "./DeleteVersionDialog";

@observer
export class ProjectPage extends React.Component<
	{ model: Model; orgId: string; projectId: string },
	{}
> {
	@observable cacheId = 0;

	constructor(p: ProjectPage["props"]) {
		super(p);

		makeObservable(this);
	}

	@computed get data() {
		this.cacheId;
		const { model, orgId, projectId } = this.props;
		const client = model.internalClient;
		return fromPromise(
			client
				? client.versionApi.getVersions({ orgId, projectId })
				: pendingPromise,
		);
	}

	@computed get projectInfo() {
		const { model, orgId, projectId } = this.props;
		const client = model.internalClient;
		return fromPromise(
			client
				? client.mainApi.getProjectInfo({ orgId, projectId })
				: pendingPromise,
		);
	}

	getNormalizedProjectInfo() {
		if (this.projectInfo.state === "fulfilled") {
			return this.projectInfo.value;
		}
		return {
			isAdmin: false,
			canDeleteVersions: false,
			canForkVersion: false,
			canConfigureVersion: false,
		};
	}

	private async fork(versionInfo: typeof sVersionInfo.T): Promise<void> {
		const { model, orgId, projectId } = this.props;
		await model.internalClient!.mainApi.createVersion({
			orgId,
			projectId,
			name: versionInfo.name,
			parents: [{ versionId: versionInfo.id }],
		});
		this.cacheId++;
	}

	@action
	private showDeleteDialog(versionInfo: typeof sVersionInfo.T): void {
		const { model, orgId, projectId } = this.props;
		model.dialog.show(
			<DeleteVersionDialog
				versionRef={{ orgId, projectId, versionId: versionInfo.id }}
				model={model}
				closeDialog={action(() => {
					model.dialog.close();
					this.cacheId++;
				})}
			/>,
		);
	}

	override render() {
		const { model, orgId, projectId } = this.props;

		if (this.data.state !== "fulfilled") {
			console.log(String(this.data.value));
		}
		return (
			<PageLayout
				model={model}
				breadcrumbs={[
					{ icon: "cube", text: orgId },
					{
						targetLocation: projectRoute.build({
							orgId: orgId,
							projectId: projectId,
						}),
						icon: "folder-close",
						text: projectId,
					},
				]}
			>
				<div className="component-ProjectPage">
					<h1 className="bp5-heading" style={{ paddingBottom: 16 }}>
						Project {projectId}
					</h1>
					<h2 className="bp5-heading">Versions</h2>

					{this.data
						.case({
							fulfilled: (v) => v.versions,
							pending: (v) => [],
							rejected: (v) => [],
						})
						.map((v) => (
							<Card
								key={v.id}
								className="part-card"
								elevation={Elevation.TWO}
							>
								<div
									className="part-info"
									style={{
										display: "flex",
										alignItems: "center",
									}}
								>
									<a
										{...model.routing.locationToOnClick(
											versionRoute.build({
												orgId,
												projectId,
												versionId: v.id,
											}),
										)}
									>
										<Icon icon="box" /> <b>{v.name}</b>
									</a>
									<div style={{ width: 16 }} />
									<div>Iteration {v.iteration}</div>
									<div style={{ width: 16 }} />
									{v.locked && (
										<div>
											<Icon icon="lock" />
										</div>
									)}
									<div style={{ marginLeft: "auto" }}>
										id: {v.id}
									</div>
									<div style={{ width: 8 }} />
									<div style={{ marginLeft: 8 }}>
										<AnchorButton
											icon="document-open"
											{...model.routing.locationToOnClick(
												versionRoute.build({
													orgId,
													projectId,
													versionId: v.id,
												}),
											)}
										/>
									</div>
									{this.getNormalizedProjectInfo()
										.canConfigureVersion && (
										<div style={{ marginLeft: 8 }}>
											<AnchorButton
												icon="cog"
												{...model.routing.locationToOnClick(
													versionSettingsRoute.build({
														orgId,
														projectId,
														versionId: v.id,
													}),
												)}
											/>
										</div>
									)}
									{this.getNormalizedProjectInfo()
										.canForkVersion && (
										<div style={{ marginLeft: 8 }}>
											<Button
												onClick={() =>
													void this.fork(v)
												}
												intent="success"
												icon="fork"
											/>
										</div>
									)}
									{this.getNormalizedProjectInfo()
										.canDeleteVersions && (
										<div style={{ marginLeft: 8 }}>
											<Button
												onClick={() =>
													this.showDeleteDialog(v)
												}
												intent="danger"
												icon="remove"
											/>
										</div>
									)}
								</div>
							</Card>
						))}
				</div>
			</PageLayout>
		);
	}
}
