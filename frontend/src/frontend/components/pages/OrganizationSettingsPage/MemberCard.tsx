import { Button, Card, Checkbox, Elevation, Icon } from "@blueprintjs/core";
import { observer } from "mobx-react";
import { OrganizationSettingsModel } from "./OrganizationSettingsModel";
import * as React from "react";

export const MemberCard = observer(
	(props: {
		memberInfo: {
			userId: number;
			username: string;
			isAdmin: boolean;
		};
		model: OrganizationSettingsModel;
	}) => {
		const { memberInfo, model } = props;

		return (
			<Card className="part-card" elevation={Elevation.TWO}>
				<div
					className="part-info"
					style={{
						display: "flex",
						alignItems: "center",
					}}
				>
					<Icon icon="user" />
					<div style={{ width: 8 }} />
					<div>
						<b>{memberInfo.username}</b>
					</div>
					<div style={{ width: 24 }} />
					<div>
						<Checkbox
							style={{ margin: 0 }}
							checked={memberInfo.isAdmin}
							onChange={(v) =>
								void model.setAdmin(
									memberInfo.userId,
									v.currentTarget.checked,
								)
							}
						>
							Admin
						</Checkbox>
					</div>

					<div style={{ marginLeft: "auto" }} />
					<div style={{ marginLeft: 16 }}>
						<Button
							icon="remove"
							intent="danger"
							onClick={() =>
								void model.removeMember(memberInfo.userId)
							}
						/>
					</div>
				</div>
			</Card>
		);
	},
);
