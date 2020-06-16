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
export class ChangePasswordDialog extends React.Component<{
	onCancel: () => void;
	onSubmit: (info: { oldPassword: string; newPassword: string }) => void;
}> {
	@observable
	oldPassword = "";

	@observable
	newPassword = "";

	constructor(p: ChangePasswordDialog["props"]) {
		super(p);

		makeObservable(this);
	}

	override render() {
		return (
			<Card
				elevation={Elevation.FOUR}
				interactive={false}
				style={{ width: 400 }}
			>
				<h1 className="bp5-heading">Change Password</h1>

				<form autoComplete="none">
					<FormGroup label="Old Password">
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ flex: 1 }}>
								<InputGroup
									placeholder={"Enter old password..."}
									value={this.oldPassword}
									autoComplete="password"
									type="password"
									onChange={
										((val) =>
											(this.oldPassword =
												val.currentTarget.value)) as React.FormEventHandler<HTMLInputElement>
									}
								/>
							</div>
							<div style={{ width: 8 }} />
						</div>
					</FormGroup>
					<FormGroup label="New Password">
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ flex: 1 }}>
								<InputGroup
									placeholder={"Enter new password..."}
									value={this.newPassword}
									autoComplete="new-password"
									type="password"
									onChange={
										((val) =>
											(this.newPassword =
												val.currentTarget.value)) as React.FormEventHandler<HTMLInputElement>
									}
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
								this.props.onSubmit({
									oldPassword: this.oldPassword,
									newPassword: this.newPassword,
								})
							}
						>
							Change
						</Button>
					</div>
				</form>
			</Card>
		);
	}
}
