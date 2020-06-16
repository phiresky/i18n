import {
	AnchorButton,
	Button,
	Card,
	Elevation,
	Icon,
	Menu,
	MenuItem,
	Popover,
} from "@blueprintjs/core";
import { action, computed, makeObservable, observable } from "mobx";
import { makeLoggable } from "mobx-log";
import { observer } from "mobx-react";
import { fromPromise } from "mobx-utils";
import * as React from "react";
import { pendingPromise } from "../../../../common/pendingPromise";
import { Model } from "../../../model";
import { PageLayout } from "../../PageLayout";
import { orgSettingsRoute, projectRoute } from "../../router";
import { DeleteDialog } from "./DeleteDialog";
import { NewOrganizationDialog } from "./NewOrganizationDialog";
import { NewProjectDialog } from "./NewProjectDialog";
import { NewUserDialog } from "./NewUserDialog";
import { UserCard } from "./UserCard";

export class OrganizationsModel {
	@observable cacheKey = 0;

	@computed get data() {
		const client = this.parentModel.internalClient;
		this.cacheKey;
		return fromPromise(
			client ? client.mainApi.getOrganizations() : pendingPromise,
		);
	}

	@computed get users() {
		const client = this.parentModel.internalClient;
		this.cacheKey;
		return fromPromise(
			client ? client.siteAdminApi.listUsers() : pendingPromise,
		);
	}

	constructor(public readonly parentModel: Model) {
		makeObservable(this);
		makeLoggable(this);
	}

	public async updateUser(userId: number, arg: { isSiteAdmin: boolean }) {
		await this.parentModel.internalClient!.siteAdminApi.updateUser({
			userId,
			isSiteAdmin: arg.isSiteAdmin,
		});
		this.cacheKey++;
	}

	@action.bound
	public showDeleteUserDialog(userId: number, username: string) {
		this.parentModel.dialog.show(
			<DeleteDialog
				caption={`Delete User ${username}`}
				onCancel={() => {
					this.parentModel.dialog.close();
				}}
				onSubmit={async () => {
					await this.parentModel.internalClient!.siteAdminApi.deleteUser(
						{ userId: userId },
					);
					this.cacheKey++;
					this.parentModel.dialog.close();
				}}
			/>,
		);
	}

	@action.bound
	public showNewProjectDialog(orgId: string) {
		this.parentModel.dialog.show(
			<NewProjectDialog
				orgId={orgId}
				onCancel={() => {
					this.parentModel.dialog.close();
				}}
				onSubmit={async (p) => {
					await this.parentModel.internalClient!.mainApi.createProject(
						p,
					);
					this.cacheKey++;
					this.parentModel.dialog.close();
				}}
			/>,
		);
	}

	@action.bound
	public showNewUserDialog() {
		this.parentModel.dialog.show(
			<NewUserDialog
				onCancel={() => {
					this.parentModel.dialog.close();
				}}
				onSubmit={async ({
					email,
					password,
					isSiteAdmin,
					username,
				}) => {
					await this.parentModel.internalClient!.siteAdminApi.createUser(
						{
							username,
							email,
							password,
							isSiteAdmin,
						},
					);
					this.cacheKey++;
					this.parentModel.dialog.close();
				}}
			/>,
		);
	}

	@action.bound
	public showNewOrganizationDialog() {
		this.parentModel.dialog.show(
			<NewOrganizationDialog
				onCancel={() => {
					this.parentModel.dialog.close();
				}}
				onSubmit={async (req) => {
					await this.parentModel.internalClient!.mainApi.createOrganization(
						{
							orgId: req.orgId,
							admins: [
								this.parentModel.currentUserInformation!
									.username,
							],
						},
					);
					this.cacheKey++;
					this.parentModel.dialog.close();
				}}
			/>,
		);
	}
}

@observer
export class OrganizationsPage extends React.Component<{ model: Model }, {}> {
	private readonly model = new OrganizationsModel(this.props.model);

	override render() {
		const { model } = this;
		console.log("MODEL", model.parentModel);

		return (
			<PageLayout model={model.parentModel} breadcrumbs={[]}>
				<div className="component-OrganizationsPage">
					<h1 className="bp5-heading" style={{ paddingBottom: 16 }}>
						Welcome,{" "}
						{
							(model.parentModel.currentUserInformation || {})
								.username
						}
						!
					</h1>

					<div style={{ display: "flex", alignItems: "center" }}>
						<h2 className="bp5-heading">Organizations</h2>
						<div style={{ marginLeft: "auto", marginRight: 20 }}>
							<Button
								icon="plus"
								intent="success"
								onClick={model.showNewOrganizationDialog}
							/>
						</div>
					</div>
					{this.model.data
						.case({
							fulfilled: (v) => v.orgs,
							pending: (v) => [],
							rejected: (v) => [],
						})
						.map((org) => (
							<Card key={org.orgId} className="part-card">
								<div
									style={{
										display: "flex",
										alignItems: "center",
									}}
								>
									<div>
										<h5 className="bp5-heading">
											<Icon icon="cube" /> {org.orgId}
										</h5>
										<p>{org.projects.length} Projects</p>
									</div>

									<div
										style={{
											marginLeft: "auto",
										}}
									/>
									{org.isAdmin && (
										<>
											<div>
												<AnchorButton
													icon="plus"
													onClick={() =>
														model.showNewProjectDialog(
															org.orgId,
														)
													}
												/>
											</div>

											<div style={{ width: 8 }} />
										</>
									)}
									{org.isAdmin && (
										<>
											<div>
												<AnchorButton
													icon="cog"
													{...model.parentModel.routing.routeToOnClick(
														orgSettingsRoute,
														{ orgId: org.orgId },
													)}
												/>
											</div>

											<div style={{ width: 8 }} />
										</>
									)}
									{org.isAdmin && (
										<div>
											<Popover
												position="bottom-right"
												minimal
											>
												<Button icon="more" />
												<Menu>
													<MenuItem
														text="Delete"
														icon="delete"
														intent="danger"
														onClick={() => {
															void model.parentModel.internalClient!.mainApi.deleteOrganization(
																{
																	orgId: org.orgId,
																},
															);
														}}
													/>
												</Menu>
											</Popover>
										</div>
									)}
								</div>

								{org.projects.map((project) => (
									<Card
										key={project.projectId}
										className="part-card"
										interactive={true}
										onClick={() =>
											model.parentModel.routing.push(
												projectRoute,
												{
													orgId: org.orgId,
													projectId:
														project.projectId,
												},
											)
										}
										elevation={Elevation.TWO}
									>
										<Icon icon="folder-open" />{" "}
										{project.projectId}
									</Card>
								))}
							</Card>
						))}
					<div style={{ height: 16 }} />
					{(model.parentModel.currentUserInformation || {})
						.isSiteAdmin && (
						<>
							<div
								style={{
									display: "flex",
									alignItems: "center",
								}}
							>
								<h2 className="bp5-heading">Users</h2>
								<div
									style={{
										marginLeft: "auto",
										marginRight: 20,
									}}
								>
									<Button
										icon="plus"
										intent="success"
										onClick={model.showNewUserDialog}
									/>
								</div>
							</div>
							{model.users
								.case({
									fulfilled: (v) => v,
									pending: (v) => [],
									rejected: (v) => [],
								})
								.map((user) => (
									<UserCard
										key={user.id}
										user={user}
										model={model}
										showDeleteDialog={() =>
											model.showDeleteUserDialog(
												user.id,
												user.username,
											)
										}
									/>
								))}
						</>
					)}
				</div>
			</PageLayout>
		);
	}
}
