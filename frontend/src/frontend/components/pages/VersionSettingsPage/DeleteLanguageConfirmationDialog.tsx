import { Button, Card, Elevation } from "@blueprintjs/core";
import * as React from "react";
import { Flag } from "../../../../common/Flag";
import { VersionSettingsPageModel } from "./VersionSettingsPageModel";

export class DeleteLanguageConfirmationDialog extends React.Component<{
	model: VersionSettingsPageModel;
	languageCodeToDelete: string;
	onCancel: () => void;
	onSubmit: () => Promise<void> | void;
}> {
	override render() {
		const { languageCodeToDelete } = this.props;
		return (
			<Card
				elevation={Elevation.FOUR}
				interactive={false}
				style={{ width: 400 }}
			>
				<h1 className="bp5-heading">
					Delete{" "}
					<span
						style={{
							border: "1px solid",
							padding: "0 5px",
							margin: 0,
							borderRadius: 10,
						}}
					>
						<Flag languageCode={languageCodeToDelete} />{" "}
						{languageCodeToDelete}
					</span>
				</h1>
				<p>
					This removes all translations associated with this language!
				</p>
				<div style={{ display: "flex" }}>
					<div style={{ flex: 1 }} />
					<Button onClick={this.props.onCancel}>Cancel</Button>
					<div style={{ width: 8 }} />
					<Button
						intent="danger"
						onClick={() => void this.props.onSubmit()}
					>
						Delete
					</Button>
				</div>
			</Card>
		);
	}
}
