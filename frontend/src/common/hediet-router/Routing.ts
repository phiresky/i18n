import { Router, RouteInformation } from "./Router";
import { LocationService, ClickInfo } from "./LocationService";
import {
	Route,
	RouteArgs,
	QueryArgs,
	RouteArgsToType,
	QueryArgsToType,
	MatcherArgs,
} from "./Route";
import { computed, makeObservable } from "mobx";
import { LocationInfo } from "./LocationInfo";

export class Routing<TData, TArgs> {
	public constructor(
		private readonly router: Router<TData, TArgs>,
		private readonly locationService: LocationService,
	) {
		makeObservable(this);
	}

	@computed get currentRouteInformation():
		| RouteInformation<TData, TArgs>
		| undefined {
		return this.router.route(this.locationService.currentLocation);
	}

	private castRouteInformation(routeInformation: RouteInformation<any, any>):
		| {
				route: Route<any, any>;
				args: Record<string, any>;
				queryArgs: Record<string, any>;
		  }
		| undefined {
		if (!(routeInformation.matcher instanceof Route)) {
			return undefined;
		}
		const args = routeInformation.args as unknown as MatcherArgs<any, any>;
		return {
			route: routeInformation.matcher,
			args: args.args,
			queryArgs: args.queryArgs,
		};
	}

	public locationToOnClick(location: LocationInfo) {
		const information = this.router.route(location);
		const i = information
			? this.castRouteInformation(information)
			: undefined;
		if (!i) {
			return this.locationService.locationToOnClick(location);
		} else {
			return this.routeToOnClick(i.route, i.args, i.queryArgs);
		}
	}

	private getLocationInfo<
		TArgs extends RouteArgs,
		TQueryArgs extends QueryArgs,
	>(
		route: Route<TArgs, TQueryArgs>,
		args: RouteArgsToType<TArgs>,
		queryArgs?: QueryArgsToType<TQueryArgs>,
	): LocationInfo {
		const locationInfo = route.build(args, queryArgs);
		const search = { ...locationInfo.search };

		const curLoc = this.locationService.currentLocation;
		for (const [key, val] of Object.entries(curLoc.search)) {
			if (key in route.queryArgs) {
				search[key] = val;
			}
		}
		return locationInfo.withSearch(search);
	}

	public routeToOnClick<
		TArgs extends RouteArgs,
		TQueryArgs extends QueryArgs,
	>(
		route: Route<TArgs, TQueryArgs>,
		args: RouteArgsToType<TArgs>,
		queryArgs?: QueryArgsToType<TQueryArgs>,
	): ClickInfo {
		return this.locationService.locationToOnClick(
			this.getLocationInfo(route, args, queryArgs),
		);
	}

	public replace<TArgs extends RouteArgs, TQueryArgs extends QueryArgs>(
		route: Route<TArgs, TQueryArgs>,
		args: RouteArgsToType<TArgs>,
		queryArgs?: QueryArgsToType<TQueryArgs>,
	): void {
		this.locationService.replace(
			this.getLocationInfo(route, args, queryArgs),
		);
	}

	public push<TArgs extends RouteArgs, TQueryArgs extends QueryArgs>(
		route: Route<TArgs, TQueryArgs>,
		args: RouteArgsToType<TArgs>,
		queryArgs?: QueryArgsToType<TQueryArgs>,
	): void {
		this.locationService.push(this.getLocationInfo(route, args, queryArgs));
	}
}
