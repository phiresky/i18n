import { Button, Card, Elevation, FormGroup } from "@blueprintjs/core";
import { makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { Flag } from "../../../../common/Flag";
import { InputGroupMobx } from "../../../../common/InputGroupMobx";
import { ref } from "../../../../embedded-editor/utils";

@observer
export class AddNewLanguageDialog extends React.Component<{
	onSubmit: (p: {
		languageCode: string;
		languageName: string;
	}) => Promise<void> | void;
	onCancel: () => void;
}> {
	constructor(p: AddNewLanguageDialog["props"]) {
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
				<h1 className="bp5-heading">Add New Language</h1>
				<FormGroup
					label="A unique identifier of the language"
					helperText={this.error ? this.error.message : undefined}
					intent={this.error ? "danger" : "none"}
				>
					<div style={{ display: "flex", alignItems: "center" }}>
						<div style={{ flex: 1 }}>
							<InputGroupMobx
								placeholder={"Enter Language Code..."}
								value={ref(this, "languageCode")}
								intent={this.error ? "danger" : "none"}
							/>
						</div>
						<div style={{ width: 8 }} />
						<Flag languageCode={this.languageCode} />
					</div>
				</FormGroup>
				<p>
					Using{" "}
					<a href="https://www.venea.net/web/culture_code">
						IETF language tags
					</a>{" "}
					is recommended.
				</p>
				<FormGroup
					label="Display name of the language"
					helperText={this.error2 ? this.error2.message : undefined}
					intent={this.error2 ? "danger" : "none"}
				>
					<div style={{ display: "flex", alignItems: "center" }}>
						<div style={{ flex: 1 }}>
							<InputGroupMobx
								placeholder={"Enter Language Name..."}
								value={ref(this, "languageName")}
								intent={this.error2 ? "danger" : "none"}
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
						onClick={() => void this.props.onSubmit(this)}
					>
						Add
					</Button>
				</div>
			</Card>
		);
	}

	get error(): { message: string } | undefined {
		if (this.languageCode === "") {
			return { message: "Language Code must be non empty." };
		}
		return undefined;
	}

	get error2(): { message: string } | undefined {
		if (this.languageName === "") {
			return { message: "Language Name must be non empty." };
		}
		return undefined;
	}

	@observable languageCode = "";

	@observable languageName = "";
}
