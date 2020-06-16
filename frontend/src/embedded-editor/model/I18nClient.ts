import { observable, action, makeObservable, runInAction } from "mobx";
import { I18nConnection } from "@hediet/i18n-api";

export class I18nClient {
	@observable connection: I18nConnection | undefined;
	@observable loggedIn = false;

	constructor(private readonly authTokenStore: AuthTokenStore) {
		makeObservable(this);
	}

	public async connect(serverUrl: string): Promise<I18nConnection> {
		if (this.connection) {
			throw new Error();
		}

		const connection = await I18nConnection.connectTo(serverUrl);

		const authToken = this.authTokenStore.getAuthToken(serverUrl);
		if (authToken) {
			try {
				await connection.authApi.authenticate({ authToken });
				runInAction(() => (this.loggedIn = true));
			} catch (e) {
				this.authTokenStore.setAuthToken(serverUrl, undefined);
			}
		}

		this.connection = connection;
		return connection;
	}

	@action
	public disconnect() {
		if (!this.connection) {
			throw new Error();
		}

		this.connection.dispose();
		this.loggedIn = false;
		this.connection = undefined;
	}

	public async login(username: string, password: string): Promise<void> {
		const { authToken } = await this.connection!.authApi.login({
			usernameOrEmail: username,
			password,
		});
		this.authTokenStore.setAuthToken(this.connection!.serverUrl, authToken);
		this.loggedIn = true;
	}
}

export interface AuthTokenStore {
	getAuthToken(serverUrl: string): string | undefined;
	setAuthToken(serverUrl: string, authToken: string | undefined): void;
}
