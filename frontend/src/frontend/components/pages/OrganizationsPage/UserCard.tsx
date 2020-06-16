import {
	Button,
	Card,
	Elevation,
	Icon,
	Menu,
	MenuItem,
	Popover,
} from "@blueprintjs/core";
import { observer } from "mobx-react";
import { OrganizationsModel } from "./OrganizationsPage";
import * as React from "react";

export const UserCard = observer(
	(props: {
		user: {
			username: string;
			email: string;
			id: number;
			isSiteAdmin: boolean;
		};
		model: OrganizationsModel;
		showDeleteDialog: () => void;
	}) => {
		const { user, showDeleteDialog, model } = props;

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
						<b>{user.username}</b>
					</div>
					<div style={{ width: 24 }} />
					<div>{user.email}</div>
					<div style={{ width: 24 }} />
					{user.isSiteAdmin && (
						<div style={{ fontWeight: "bold", color: "red" }}>
							Site Admin
						</div>
					)}

					<div style={{ marginLeft: "auto" }} />

					<div style={{ marginLeft: 8 }}>
						<Popover position="bottom-right" minimal>
							<Button icon="more" />
							<Menu>
								{user.isSiteAdmin ? (
									<MenuItem
										text="Revoke Site Admin Priviliges"
										icon="take-action"
										onClick={() =>
											void model.updateUser(user.id, {
												isSiteAdmin: false,
											})
										}
									/>
								) : (
									<MenuItem
										text="Grant Site Admin Priviliges"
										icon="take-action"
										onClick={() =>
											void model.updateUser(user.id, {
												isSiteAdmin: true,
											})
										}
									/>
								)}
								<MenuItem
									text="Set Password"
									icon="take-action"
									onClick={() => 2}
								/>
								<MenuItem
									text="Delete"
									icon="delete"
									intent="danger"
									onClick={showDeleteDialog}
								/>
							</Menu>
						</Popover>
					</div>
				</div>
			</Card>
		);
	},
);
