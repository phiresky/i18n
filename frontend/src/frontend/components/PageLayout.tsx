import {
	Alignment,
	Breadcrumbs,
	Button,
	IconName,
	Navbar,
	Overlay,
	Popover,
	Spinner,
} from "@blueprintjs/core";
import { action, makeObservable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { LocationInfo } from "../../common/hediet-router";
import { Model } from "../model";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { mainRoute } from "./router";

@observer
export class PageLayout extends React.Component<
	{
		model: Model;
		breadcrumbs: Breadcrumb[];
		children: React.ReactNode;
		itemsNavBarRight?: React.ReactNode;
	},
	{}
> {
	constructor(p: PageLayout["props"]) {
		super(p);

		makeObservable(this);
	}

	@action.bound
	private showChangePasswordDialog() {
		this.props.model.dialog.show(
			<ChangePasswordDialog
				onCancel={() => {
					this.props.model.dialog.close();
				}}
				onSubmit={({ newPassword, oldPassword }) =>
					void (async () => {
						await this.props.model.internalClient!.authApi.changePassword(
							{
								oldPassword,
								newPassword,
							},
						);
						this.props.model.dialog.close();
					})()
				}
			/>,
		);
	}

	override render() {
		const { model, breadcrumbs, children, itemsNavBarRight } = this.props;

		// bp5-dark
		return (
			<div
				className="component-MainView"
				style={{ display: "flex", flexDirection: "column" }}
			>
				<Overlay
					isOpen={model.dialog.currentContent !== undefined}
					onClose={model.dialog.close}
					autoFocus
				>
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							margin: "10vh 0",
							width: "100%",
							pointerEvents: "none",
						}}
					>
						<div style={{ pointerEvents: "all" }}>
							{model.dialog.currentContent}
						</div>
					</div>
				</Overlay>
				<Navbar>
					<Navbar.Group align={Alignment.CENTER}>
						<Navbar.Heading>
							<a {...model.routing.routeToOnClick(mainRoute, {})}>
								I18n Editor
							</a>
						</Navbar.Heading>
						<Navbar.Divider />

						<Breadcrumbs
							className="part-breadcrumbs"
							items={breadcrumbs.map((b) => ({
								...(b.targetLocation
									? model.routing.locationToOnClick(
											b.targetLocation,
										)
									: {}),
								text: b.text,
								icon: b.icon,
							}))}
						/>
						{itemsNavBarRight}
						{model.connectionState.kind !== "connected" && (
							<Spinner size={24} />
						)}
						{model.currentUserInformation && (
							<Popover portalContainer={document.body}>
								<Button icon="user" minimal />
								<div style={{ padding: 16 }}>
									<h2 className="bp5-heading">
										Hello,{" "}
										{model.currentUserInformation.username}
									</h2>

									<div
										style={{
											display: "flex",
											flexDirection: "column",
										}}
									>
										<Button
											icon="key"
											alignText="left"
											onClick={
												this.showChangePasswordDialog
											}
										>
											Change Password
										</Button>
										<div style={{ height: 8 }} />
										<Button
											icon="log-out"
											alignText="left"
											onClick={() =>
												void model.client!.logout()
											}
										>
											Logout
										</Button>
									</div>
								</div>
							</Popover>
						)}
					</Navbar.Group>
				</Navbar>
				<div style={{ flex: 1, overflow: "auto" }}>{children}</div>
			</div>
		);
	}
}

export interface Breadcrumb {
	targetLocation?: LocationInfo;
	text: string;
	icon: IconName;
}
