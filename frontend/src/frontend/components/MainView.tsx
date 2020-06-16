import { observer } from "mobx-react";
import * as React from "react";
import { Model } from "../model";
import { mainRoute } from "./router";

@observer
export class MainView extends React.Component<{ model: Model }, {}> {
	override render() {
		const { model } = this.props;
		const currentRouteInformation = model.routing.currentRouteInformation;

		if (currentRouteInformation) {
			return currentRouteInformation.data.getContent(model);
		} else {
			model.routing.replace(mainRoute, {});
			return null;
		}
	}
}
