import { Disposable } from "@hediet/std/disposable";
import { createBrowserHistory, History } from "history";
import { action, makeObservable, observable } from "mobx";
import { LocationInfo } from "./LocationInfo";

export interface ClickInfo {
	href: string;
	onClick: (e: React.MouseEvent<HTMLElement>) => void;
}

export class LocationService {
	public readonly dispose = Disposable.fn();

	@observable
	_currentLocation: LocationInfo;
	public get currentLocation(): LocationInfo {
		return this._currentLocation;
	}

	private readonly history: History;

	constructor() {
		makeObservable(this);
		this.history = createBrowserHistory();
		this.dispose.track({
			dispose: this.history.listen((e) => {
				console.log("EEEEEE UPDAT");
				action("Update current location", () => {
					console.log("UDPTA2");
					this._currentLocation = LocationInfo.fromHistoryLocation(
						e.location,
					);
					console.log("new loc", this._currentLocation);
				})();
			}),
		});
		this._currentLocation = LocationInfo.fromHistoryLocation(
			this.history.location,
		);
	}

	public locationToOnClick(location: LocationInfo): ClickInfo {
		return {
			onClick: (e: React.MouseEvent<HTMLElement>) => {
				e.preventDefault();
				this.push(location);
			},
			href: location.toString(),
		};
	}

	public pushPath(path: string): void {
		const loc = this.currentLocation.withPath(path);
		this.push(loc);
	}

	public replacePath(path: string): void {
		const loc = this.currentLocation.withPath(path);
		this.replace(loc);
	}

	public push(newLocation: LocationInfo): void {
		console.log("history.push", newLocation);
		this.history.push(newLocation.toHistoryLocation());
	}

	public replace(newLocation: LocationInfo): void {
		console.log("history.replace", newLocation);
		this.history.replace(newLocation.toHistoryLocation());
	}

	public pop(): boolean {
		this.history.back();
		return true;
	}
}
