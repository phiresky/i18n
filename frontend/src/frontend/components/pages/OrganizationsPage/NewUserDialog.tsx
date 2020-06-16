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
export class NewUserDialog extends React.Component<{
	onCancel: () => void;
	onSubmit: (user: {
		username: string;
		email: string;
		password: string;
		isSiteAdmin: boolean;
	}) => Promise<void> | void;
}> {
	constructor(p: NewUserDialog["props"]) {
		super(p);

		makeObservable(this);
	}

	get error(): { message: string } | undefined {
		return undefined;
	}

	@observable username = "";
	@observable email = "";
	@observable password = "";

	override render() {
		return (
			<Card
				elevation={Elevation.FOUR}
				interactive={false}
				style={{ width: 400 }}
			>
				<h1 className="bp5-heading">New User</h1>
				<form autoComplete="none">
					<FormGroup
						label="Username"
						helperText={this.error ? this.error.message : undefined}
						intent={this.error ? "danger" : "none"}
					>
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ flex: 1 }}>
								<InputGroup
									placeholder={"Enter a username..."}
									value={this.username}
									autoComplete="new-password"
									onChange={
										((val) =>
											(this.username =
												val.currentTarget.value)) as React.FormEventHandler<HTMLInputElement>
									}
									intent={this.error ? "danger" : "none"}
								/>
							</div>
							<div style={{ width: 8 }} />
						</div>
					</FormGroup>
					<FormGroup
						label="E-Mail"
						helperText={this.error ? this.error.message : undefined}
						intent={this.error ? "danger" : "none"}
					>
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ flex: 1 }}>
								<InputGroup
									placeholder={"Enter an E-Mail Address..."}
									value={this.email}
									autoComplete="new-password"
									onChange={
										((val) =>
											(this.email =
												val.currentTarget.value)) as React.FormEventHandler<HTMLInputElement>
									}
									intent={this.error ? "danger" : "none"}
								/>
							</div>
							<div style={{ width: 8 }} />
						</div>
					</FormGroup>
					<FormGroup
						label="Password"
						helperText={this.error ? this.error.message : undefined}
						intent={this.error ? "danger" : "none"}
					>
						<div style={{ display: "flex", alignItems: "center" }}>
							<div style={{ flex: 1 }}>
								<InputGroup
									placeholder={"Enter a password..."}
									value={this.password}
									autoComplete="new-password"
									type="password"
									onChange={
										((val) =>
											(this.password =
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
									email: this.email,
									password: this.password,
									isSiteAdmin: false,
									username: this.username,
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
