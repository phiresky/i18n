import { makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import * as React from "react";
import { Model } from "../model";
import { VisibleTranslation } from "./VisibleTranslationFinder";
import { Widget } from "./widget/Widget";

export const zIndex = 9999999;

@observer
export class MainView extends React.Component<{ model: Model }, {}> {
	@observable hoveredTranslatable: VisibleTranslation | undefined = undefined;

	constructor(props: { model: Model }) {
		super(props);
		makeObservable(this);
	}

	override render() {
		const model = this.props.model;
		return (
			<>
				<Widget model={model} />
				{model.translatablesHighlighted && (
					<div
						style={{
							position: "fixed",
							top: 0,
							bottom: 0,
							left: 0,
							right: 0,
							//background: "red",
							//opacity: 0.2,
							zIndex: zIndex - 1,
						}}
						onMouseMove={(e) => {
							this.hoveredTranslatable =
								model.visibleTranslationFinder.findTranslatableAt(
									{ x: e.clientX, y: e.clientY },
								);
						}}
					>
						{model.visibleTranslationFinder.translatables.map(
							(visibleTranslation, idx) => (
								<div
									key={idx}
									style={{
										position: "absolute",
										background: "blue",
										opacity: 0.2,
										...visibleTranslation.region.toTopLeftWidthHeight(),
										cursor: "pointer",
									}}
									onClick={() => {
										model.selectedVisibleTranslation =
											visibleTranslation;
									}}
								></div>
							),
						)}
					</div>
				)}
			</>
		);
	}
}
