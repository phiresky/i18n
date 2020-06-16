import {
	Button,
	Card,
	Elevation,
	FormGroup,
	InputGroup,
} from "@blueprintjs/core";
import { makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";

@observer
export class NewProjectDialog extends React.Component<{
	orgId: string;
	onCancel: () => void;
	onSubmit: (user: {
		orgId: string;
		projectId: string;
	}) => Promise<void> | void;
}> {
	constructor(p: NewProjectDialog["props"]) {
		super(p);

		makeObservable(this);
	}

	get error(): { message: string } | undefined {
		return undefined;
	}

	@observable projectId = "";

	override render() {
		return (
			<Card
				elevation={Elevation.FOUR}
				interactive={false}
				style={{ width: 400 }}
			>
				<h1 className="bp5-heading">New Project</h1>
				<form autoComplete="none">
					<FormGroup
						label="Project ID"
						helperText={this.error ? this.error.message : undefined}
						intent={this.error ? "danger" : "none"}
					>
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ flex: 1 }}>
								<InputGroup
									placeholder={"Enter a project name..."}
									value={this.projectId}
									autoComplete="new-password"
									onChange={
										((val) =>
											(this.projectId =
												val.currentTarget.value)) as React.FormEventHandler<HTMLInputElement>
									}
									intent={this.error ? "danger" : "none"}
								/>
							</div>
							<div style={{ width: 8 }} />
						</div>
					</FormGroup>

					<div style={{ display: "flex" }}>
						<div style={{ flex: 1 }} />
						<Button onClick={this.props.onCancel}>Cancel</Button>
						<div style={{ width: 8 }} />
						<Button
							intent="success"
							onClick={() =>
								void this.props.onSubmit({
									orgId: this.props.orgId,
									projectId: this.projectId,
								})
							}
						>
							Add
						</Button>
					</div>
				</form>
			</Card>
		);
	}
}
