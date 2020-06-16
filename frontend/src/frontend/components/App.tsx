import * as React from "react";
import { Model } from "../model";
import { MainView } from "./MainView";

export class App extends React.Component {
	private readonly model = new Model();

	override render() {
		return <MainView model={this.model} />;
	}
}
