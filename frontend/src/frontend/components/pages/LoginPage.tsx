import { Button, FormGroup } from "@blueprintjs/core";
import { computed, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import { fromPromise } from "mobx-utils";
import * as React from "react";
import { InputGroupMobx } from "../../../common/InputGroupMobx";
import { pendingPromise } from "../../../common/pendingPromise";
import { ref } from "../../../embedded-editor/utils";
import { Model } from "../../model";
import { PageLayout } from "../PageLayout";
import { loginRoute, mainRoute } from "../router";

@observer
export class LoginPage extends React.Component<{ model: Model }, {}> {
	constructor(p: LoginPage["props"]) {
		super(p);

		makeObservable(this);
	}

	@computed get data() {
		const client = this.props.model.internalClient;
		return fromPromise(
			client ? client.mainApi.getOrganizations() : pendingPromise,
		);
	}

	private readonly formRef = React.createRef<HTMLFormElement>();

	@observable usernameOrEmail = "";
	@observable password = "";

	override render() {
		const { model } = this.props;

		return (
			<PageLayout
				model={model}
				breadcrumbs={[
					{
						icon: "log-in",
						text: "Login",
						targetLocation: loginRoute.build({}),
					},
				]}
			>
				<div className="component-LoginPage" style={{ padding: 10 }}>
					<h1 className="bp5-heading" style={{ paddingBottom: 16 }}>
						Login
					</h1>
					<div style={{ display: "flex", justifyContent: "center" }}>
						<div style={{ width: 300 }}>
							<form
								ref={this.formRef}
								autoComplete="on"
								onSubmit={(e) =>
									void (async () => {
										e.preventDefault();
										await model.client!.login(
											this.usernameOrEmail,
											this.password,
										);
										model.routing.replace(mainRoute, {});
									})()
								}
							>
								<FormGroup label="E-Mail">
									<InputGroupMobx
										name="username"
										autoComplete="username"
										placeholder="Enter your username or email..."
										value={ref(this, "usernameOrEmail")}
									/>
								</FormGroup>
								<FormGroup label="Password">
									<InputGroupMobx
										name="password"
										type="password"
										autoComplete="current-password"
										placeholder="Enter your password..."
										value={ref(this, "password")}
									/>
								</FormGroup>
								<div style={{ display: "flex" }}>
									<Button
										icon="log-in"
										intent="primary"
										type="submit"
									>
										Login
									</Button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</PageLayout>
		);
	}
}
