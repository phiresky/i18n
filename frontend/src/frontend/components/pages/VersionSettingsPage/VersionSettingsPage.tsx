import { AnchorButton, Button, Checkbox, FormGroup } from "@blueprintjs/core";
import { sVersionRef } from "@hediet/i18n-api";
import { action, makeObservable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { Model } from "../../../model";
import { PageLayout } from "../../PageLayout";
import { projectRoute, versionRoute, versionSettingsRoute } from "../../router";
import { AddNewLanguageDialog } from "./AddNewLanguageDialog";
import { DeleteLanguageConfirmationDialog } from "./DeleteLanguageConfirmationDialog";
import { LanguageCard } from "./LangCard";
import { VersionSettingsPageModel } from "./VersionSettingsPageModel";

@observer
export class VersionSettingsPage extends React.Component<{
	model: Model;
	version: (typeof sVersionRef)["T"];
}> {
	private readonly model = new VersionSettingsPageModel(
		this.props.model,
		this.props.version,
	);

	constructor(p: VersionSettingsPage["props"]) {
		super(p);

		makeObservable(this);
	}

	@action.bound
	private showNewDialog() {
		this.model.parentModel.dialog.show(
			<AddNewLanguageDialog
				onCancel={() => {
					this.model.parentModel.dialog.close();
				}}
				onSubmit={async (obj) => {
					await this.model.parentModel.internalClient!.versionApi.postLanguage(
						{
							version: this.model.version,
							...obj,
						},
					);
					this.model.parentModel.dialog.close();
					this.model.refresh();
				}}
			/>,
		);
	}

	@action.bound
	private showDeleteDialog(languageCode: string) {
		this.model.parentModel.dialog.show(
			<DeleteLanguageConfirmationDialog
				languageCodeToDelete={languageCode}
				model={this.model}
				onSubmit={async () => {
					await this.model.parentModel.internalClient!.versionApi.deleteLanguage(
						{
							version: this.model.version,
							languageCode: languageCode,
						},
					);
					this.model.refresh();
					this.model.parentModel.dialog.close();
				}}
				onCancel={() => {
					this.model.parentModel.dialog.close();
				}}
			/>,
		);
	}

	override render() {
		const { version } = this.props;
		const data = this.model.data;

		if (data.state !== "fulfilled") {
			console.log(String(data.value));
		}

		return (
			<PageLayout
				model={this.props.model}
				breadcrumbs={[
					{ icon: "cube", text: version.orgId },
					{
						targetLocation: projectRoute.build(version),
						icon: "folder-close",
						text: version.projectId,
					},
					{
						targetLocation: versionRoute.build(version),
						icon: "box",
						text: version.versionId,
					},
					{
						targetLocation: versionSettingsRoute.build(version),
						icon: "cog",
						text: "Settings",
					},
				]}
				itemsNavBarRight={
					<AnchorButton
						{...this.props.model.routing.locationToOnClick(
							versionRoute.build({ ...version }),
						)}
						minimal
						icon={"cross"}
					/>
				}
			>
				<div className="component-VersionSettingsPage">
					<h1 className="bp5-heading">
						Configure {this.model.version.versionId}
					</h1>
					<div>
						<h2 className="bp5-heading">Options</h2>
						<FormGroup helperText="Enable this if only admins should be able to change translations">
							<Checkbox
								checked={
									!!data.case({
										fulfilled: (v) => v.locked,
									})
								}
								onChange={(e) =>
									void this.model.configureVersion({
										locked: e.currentTarget.checked,
									})
								}
								label="Only Admins Can Edit"
							/>
						</FormGroup>
					</div>
					<div style={{ display: "flex", alignItems: "center" }}>
						<h2 className="bp5-heading">Languages</h2>
						<div style={{ marginLeft: "auto", marginRight: 20 }}>
							<Button
								icon="plus"
								intent="success"
								onClick={this.showNewDialog}
							/>
						</div>
					</div>
					{data.case({
						fulfilled: (v) =>
							v.languages.map((lang) => (
								<LanguageCard
									key={lang.languageCode}
									model={this.model}
									lang={lang}
									isDefaultLanguage={
										lang.languageCode ===
										v.defaultLanguageCode
									}
									showDeleteDialog={() =>
										this.showDeleteDialog(lang.languageCode)
									}
								/>
							)),
					})}
					<div style={{ marginTop: "0px" }} />
				</div>
			</PageLayout>
		);
	}
}
