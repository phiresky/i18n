import { Button, FormGroup } from "@blueprintjs/core";
import { action, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { InputGroupMobx } from "../../../../../common/InputGroupMobx";
import { Model } from "../../../../model";
import { ref } from "../../../../utils";

@observer
export class ConnectPage extends React.Component<{ model: Model }> {
	@observable serverUrl = "";
	@observable username = "";
	@observable password = "";

	constructor(props: { model: Model }) {
		super(props);
		makeObservable(this);
	}

	@action.bound
	private async connect() {
		await this.props.model.connect(
			this.serverUrl,
			this.username,
			this.password,
		);
	}

	override render() {
		return (
			<div>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						void this.connect();
					}}
				>
					<FormGroup label="I18n Server Url">
						<InputGroupMobx
							placeholder={"Enter Server Url..."}
							value={ref(this, "serverUrl")}
						/>
					</FormGroup>
					<FormGroup label="Username">
						<InputGroupMobx
							placeholder={"Enter Username..."}
							value={ref(this, "username")}
						/>
					</FormGroup>
					<FormGroup label="Password">
						<InputGroupMobx
							placeholder={"Enter Password..."}
							value={ref(this, "password")}
							autoComplete="section-i18n username"
							type="password"
						/>
					</FormGroup>
					<Button type="submit">Connect</Button>
				</form>
			</div>
		);
	}
}
