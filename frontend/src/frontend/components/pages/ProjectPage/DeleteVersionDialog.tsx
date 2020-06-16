import { Button, Card, Elevation } from "@blueprintjs/core";
import { VersionRef } from "@hediet/i18n-api";
import { action, makeObservable } from "mobx";
import * as React from "react";
import { Model } from "../../../model";

export class DeleteVersionDialog extends React.Component<{
	model: Model;
	versionRef: VersionRef;
	closeDialog: () => void;
}> {
	constructor(p: DeleteVersionDialog["props"]) {
		super(p);

		makeObservable(this);
	}

	override render() {
		const { versionRef } = this.props;
		return (
			<Card
				elevation={Elevation.FOUR}
				interactive={false}
				style={{ width: 400 }}
			>
				<h1>Delete Version "{versionRef.versionId}"</h1>
				This removes all languages and translations associated with this
				version!
				<div style={{ display: "flex" }}>
					<div style={{ flex: 1 }} />
					<Button onClick={this.cancel}>Cancel</Button>
					<div style={{ width: 8 }} />
					<Button intent="danger" onClick={() => void this.submit()}>
						Delete
					</Button>
				</div>
			</Card>
		);
	}

	@action.bound
	private cancel() {
		this.props.closeDialog();
	}

	@action.bound
	private async submit() {
		await this.props.model.internalClient!.mainApi.deleteVersion({
			version: this.props.versionRef,
		});
		this.props.closeDialog();
	}
}
