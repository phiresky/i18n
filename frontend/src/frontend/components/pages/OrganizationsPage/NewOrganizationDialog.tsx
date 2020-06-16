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
export class NewOrganizationDialog extends React.Component<{
	onCancel: () => void;
	onSubmit: (req: { orgId: string }) => void | Promise<void>;
}> {
	constructor(p: NewOrganizationDialog["props"]) {
		super(p);
		makeObservable(this);
	}
	@observable orgId = "";
	@observable error: Error | null = null;
	override render() {
		return (
			<Card
				elevation={Elevation.FOUR}
				interactive={false}
				style={{ width: 400 }}
			>
				<h1 className="bp5-heading">New Organization</h1>
				<FormGroup
					label="Organization ID"
					helperText={this.error ? this.error.message : undefined}
					intent={this.error ? "danger" : "none"}
				>
					<div style={{ display: "flex", alignItems: "center" }}>
						<div style={{ flex: 1 }}>
							<InputGroup
								placeholder={"Enter a name..."}
								value={this.orgId}
								autoComplete="new-password"
								onChange={(val) =>
									(this.orgId = val.currentTarget.value)
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
								orgId: this.orgId,
							})
						}
					>
						Add
					</Button>
				</div>
			</Card>
		);
	}
}
