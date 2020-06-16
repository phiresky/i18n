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
export class NewMemberDialog extends React.Component<{
	onCancel: () => void;
	onSubmit: (details: { username: string }) => Promise<void> | void;
}> {
	constructor(p: NewMemberDialog["props"]) {
		super(p);

		makeObservable(this);
	}

	get error(): { message: string } | undefined {
		return undefined;
	}

	@observable username = "";

	override render() {
		return (
			<Card
				elevation={Elevation.FOUR}
				interactive={false}
				style={{ width: 400 }}
			>
				<h1 className="bp5-heading">Add Member</h1>
				<form
					autoComplete="none"
					onSubmit={(e) => {
						e.preventDefault();
						void this.props.onSubmit({
							username: this.username,
						});
					}}
				>
					<FormGroup
						label="Username To Add"
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

					<div style={{ display: "flex" }}>
						<div style={{ flex: 1 }} />
						<Button onClick={this.props.onCancel}>Cancel</Button>
						<div style={{ width: 8 }} />
						<Button intent="success" type="submit">
							Add
						</Button>
					</div>
				</form>
			</Card>
		);
	}
}
