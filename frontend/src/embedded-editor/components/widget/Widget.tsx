import { Button, Icon } from "@blueprintjs/core";
import { action, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { Model } from "../../model";
import { DragBehavior, identity } from "../../utils/DragBehavior";
import { zIndex } from "../MainView";
import { ConnectPage } from "./pages/ConnectPage/ConnectPage";
import { SettingsPage } from "./pages/SettingsPage/SettingsPage";
import { TranslationPage } from "./pages/TranslationPage/TranslationPage";

export const dragBehavior = new DragBehavior();

@observer
export class Widget extends React.Component<{ model: Model }> {
	@observable mouseHover = false;

	constructor(props: { model: Model }) {
		super(props);
		makeObservable(this);
	}

	override render() {
		const { model } = this.props;

		return (
			<div
				style={{
					position: "fixed",
					top: model.widgetOffset.y,
					left: model.widgetOffset.x,
					zIndex,
					border: "1px solid white",
					backgroundColor: "#007ACC",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							cursor: "move",
						}}
						onMouseDown={(e) => {
							e.preventDefault();
							const op = dragBehavior
								.start(
									undefined,
									identity
										.relative()
										.translate(model.widgetOffset),
								)
								.endOnMouseUp();

							let moved = false;
							op.onDrag.sub(
								action(({ position }) => {
									moved = true;
									model.widgetOffset = position;
								}),
							);
							op.onEnd.sub(() => {
								if (!moved) {
									model.toggleEnabled();
								}
							});
						}}
					>
						<Logo style={{ cursor: "pointer" }} />
						{model.enabled && (
							<div style={{ marginRight: "auto" }}>
								<span
									style={{
										margin: 10,
										padding: 0,
										fontWeight: "normal",
										color: "white",
									}}
								>
									Translation Editor
								</span>
							</div>
						)}
					</div>

					{model.enabled && (
						<>
							<div style={{ marginLeft: "auto" }} />
							<div>
								<Button
									disabled={!model.client.loggedIn}
									active={model.translatablesHighlighted}
									icon={<Icon icon="hand-up" color="white" />}
									minimal
									onClick={model.highlightTranslatables}
								/>
							</div>
							<div style={{ width: 8 }} />

							<div>
								<Button
									active={model.settingsActive}
									icon={<Icon icon="cog" color="white" />}
									minimal
									onClick={model.toggleSettings}
								/>
							</div>
							<div style={{ width: 8 }} />
							<div>
								<Button
									icon={<Icon icon="cross" color="white" />}
									minimal
									onClick={model.close}
								/>
							</div>
							<div style={{ width: 8 }} />
						</>
					)}
				</div>

				{model.enabled && (
					<div
						style={{
							background: "white",
							margin: 3,
							minHeight: 200,
							padding: 8,
							minWidth: 300,
						}}
					>
						{
							{
								connect: <ConnectPage model={model} />,
								"language-selection": (
									<SettingsPage model={model} />
								),
								main: <TranslationPage model={model} />,
							}[model.currentPage.kind]
						}
					</div>
				)}
			</div>
		);
	}
}

@observer
class Logo extends React.Component<React.HTMLAttributes<HTMLDivElement>> {
	@observable mouseHover = false;

	constructor(props: React.HTMLAttributes<HTMLDivElement>) {
		super(props);
		makeObservable(this);
	}

	override render() {
		return (
			<div
				{...this.props}
				className="part-icon"
				style={{
					position: "relative",
					width: 42,
					height: 42,
					margin: 1,
					...this.props.style,
				}}
				onMouseEnter={action(() => {
					this.mouseHover = true;
				})}
				onMouseLeave={action(() => {
					this.mouseHover = false;
				})}
			>
				<div
					className="part-backgroundImage"
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
					}}
				/>
				<div
					style={{
						position: "absolute",
						width: "100%",
						height: "100%",
						background: "white",
						opacity: this.mouseHover ? 0.4 : 0,
					}}
				/>
			</div>
		);
	}
}
