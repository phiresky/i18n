import { Button, Card, Elevation } from "@blueprintjs/core";
import * as React from "react";

export class DeleteDialog extends React.Component<{
	caption: React.ReactChild;
	onCancel: () => void;
	onSubmit: () => Promise<void> | void;
}> {
	override render() {
		return (
			<Card
				elevation={Elevation.FOUR}
				interactive={false}
				style={{ width: 400 }}
			>
				<h1 className="bp5-heading">{this.props.caption}</h1>

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
