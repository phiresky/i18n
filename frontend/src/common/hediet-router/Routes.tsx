import { observer } from "mobx-react";
import * as React from "react";
import { LocationInfo } from "./LocationInfo";
import { LocationService } from "./LocationService";
import { Matcher } from "./Route";

@observer
export class Routes extends React.Component<{
	locationService: LocationService;
	config: (config: RoutesConfig) => void;
}> {
	override render() {
		const routes = new Array<{
			matcher: Matcher<any>;
			render: (args: any) => React.ReactNode;
		}>();

		const c: RoutesConfig = {
			addDefault: (render) =>
				routes.push({
					matcher: { matches: (location) => location },
					render,
				}),
			addRoute: (matcher, render) => routes.push({ matcher, render }),
		};
		this.props.config(c);

		const curLoc = this.props.locationService.currentLocation;
		for (const r of routes) {
			const args = r.matcher.matches(curLoc) as unknown;
			if (args !== undefined) {
				return <>{r.render(args)}</>;
			}
		}

		return null;
	}
}

export interface RoutesConfig {
	addRoute<T>(
		matcher: Matcher<T>,
		render: (args: T) => React.ReactNode,
	): void;
	addDefault(render: (location: LocationInfo) => React.ReactNode): void;
}
