import {
	I18nConnection,
	sessionTokenCookieName,
	unauthorizedErrorCode,
} from "@hediet/i18n-api";
import { EventEmitter } from "@hediet/std/events";
import { wait } from "@hediet/std/timer";
import { action, makeObservable, observable } from "mobx";
import { makeLoggable } from "mobx-log";
import { LocationService } from "../../common/hediet-router/LocationService";
import { Routing } from "../../common/hediet-router/Routing";
import { loginRoute, router } from "../components/router";
import Cookies from "js-cookie";
class DialogService {
	@observable.ref private _currentContent: React.ReactNode | undefined;

	constructor() {
		makeObservable(this);
		makeLoggable(this);
	}

	public get currentContent(): React.ReactNode | undefined {
		return this._currentContent;
	}

	@action
	public show(content: React.ReactNode): void {
		this._currentContent = content;
	}

	@action.bound
	public close(): void {
		this._currentContent = undefined;
	}
}

export class Model {
	public readonly routing = new Routing(router, new LocationService());
	public readonly dialog = new DialogService();

	public get internalClient(): I18nConnection | undefined {
		if (!this.client) {
			return undefined;
		}
		return this.client.client;
	}

	@observable
	public client: ClientWrapper | undefined = undefined;

	get currentUserInformation(): UserInformation | undefined {
		if (!this.client || !this.client.currentUserInformation) {
			return undefined;
		}
		return this.client.currentUserInformation;
	}

	@observable connectionState:
		| { kind: "connected" }
		| { kind: "connecting" }
		| { kind: "disconnected" }
		| { kind: "error"; error: string } = { kind: "connecting" };

	constructor() {
		makeObservable(this);
		makeLoggable(this);
		void this.init();
	}

	async init(): Promise<void> {
		const cur = this.routing.currentRouteInformation;
		let serverUrl = location.origin;
		console.log(serverUrl, cur?.args.queryArgs);
		if (cur && cur.args.queryArgs.serverUrl) {
			serverUrl = cur.args.queryArgs.serverUrl;
		}

		while (true) {
			this.connectionState = { kind: "connecting" };
			try {
				console.log("connecting...");
				const client = await I18nConnection.connectTo(serverUrl);
				console.log("CLIENT", client);
				this.connectionState = { kind: "connected" };

				const wrapper = await ClientWrapper.initializeFrom(client);
				wrapper.onLogout.sub(() => {
					this.routing.push(loginRoute, {});
				});
				this.client = wrapper;

				await client.stream.onClosed;
				this.connectionState = { kind: "disconnected" };
			} catch (e) {
				console.error("connection", e);
				this.connectionState = { kind: "error", error: e as string };
			}
			this.client = undefined;
			await wait(3000);
		}
	}
}

export interface UserInformation {
	email: string;
	username: string;
	isSiteAdmin: boolean;
}

export class ClientWrapper {
	@observable currentUserInformation: undefined | UserInformation;

	public static async initializeFrom(
		client: I18nConnection,
	): Promise<ClientWrapper> {
		const wrapper = new ClientWrapper(client);
		await wrapper.tryLoginWithCookie();
		return wrapper;
	}

	private readonly logoutEmitter = new EventEmitter();
	public readonly onLogout = this.logoutEmitter.asEvent();

	constructor(public readonly client: I18nConnection) {
		makeObservable(this);
		makeLoggable(this);
		client.channel.onRequestDidError.sub(({ error }) => {
			console.error(error);
			if (error.code === unauthorizedErrorCode) {
				Cookies.remove(sessionTokenCookieName);
				this.currentUserInformation = undefined;
				this.logoutEmitter.emit();
			}
		});
	}

	private async tryLoginWithCookie(): Promise<void> {
		const authToken = Cookies.get(sessionTokenCookieName);
		if (!authToken) {
			return;
		}
		try {
			await this.client.authApi.authenticate({ authToken });
		} catch (e) {
			Cookies.remove(sessionTokenCookieName);
		}
		this.currentUserInformation =
			await this.client.authApi.getCurrentUserInformation();
	}

	public async login(usernameOrEmail: string, password: string) {
		if (!this.client) {
			return;
		}
		const { authToken } = await this.client.authApi.login({
			usernameOrEmail,
			password,
		});
		Cookies.set(sessionTokenCookieName, authToken, { expires: 7 });
		this.currentUserInformation =
			await this.client.authApi.getCurrentUserInformation();
	}

	public async logout(): Promise<void> {
		if (!this.client) {
			return;
		}
		await this.client.authApi.destroySession();
		Cookies.remove(sessionTokenCookieName);
		this.currentUserInformation = undefined;
		this.logoutEmitter.emit();
	}
}
