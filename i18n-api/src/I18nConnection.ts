import {
	ConsoleRpcLogger,
	ContractInterfaceOf,
	TypedChannel,
} from "@hediet/json-rpc";
import { WebSocketStream } from "@hediet/json-rpc-websocket";
import { Disposable } from "@hediet/std/disposable";
import { EventTimer } from "@hediet/std/timer";
import { authContract } from "./loginContract";
import { mainContract } from "./mainContract";
import { siteAdminContract } from "./siteAdminContract";
import { versionContract } from "./versionContract";

export class I18nConnection {
	public static async connectTo(serverUrl: string): Promise<I18nConnection> {
		console.log("connecting to ", serverUrl);
		// Remove trailing /
		if (serverUrl.endsWith("/")) {
			serverUrl = serverUrl.substr(0, serverUrl.length - 1);
		}

		const wsUrl = serverUrl.replace(/^http/, "ws");

		const stream = await WebSocketStream.connectTo({
			address: wsUrl,
		});

		const channel = TypedChannel.fromStream(stream, {
			logger:
				process.env["NODE_ENV"] === "development"
					? new ConsoleRpcLogger()
					: undefined,
			ignoreUnexpectedPropertiesInResponses:
				process.env["NODE_ENV"] !== "development",
		});
		channel.startListen();
		return new I18nConnection(serverUrl, channel, stream);
	}

	public readonly authApi: ContractInterfaceOf<
		(typeof authContract)["TContractObject"]["server"],
		void
	>;
	public readonly siteAdminApi: ContractInterfaceOf<
		(typeof siteAdminContract)["TContractObject"]["server"],
		void
	>;
	public readonly mainApi: ContractInterfaceOf<
		(typeof mainContract)["TContractObject"]["server"],
		void
	>;
	public readonly versionApi: ContractInterfaceOf<
		(typeof versionContract)["TContractObject"]["server"],
		void
	>;

	public getTranslationsJsonUrl(
		orgId: string,
		projectId: string,
		versionId: string,
		lang: string,
	): string {
		return `${this.serverUrl}/orgs/${orgId}/projects/${projectId}/versions/${versionId}/translations/${lang}`;
	}

	public readonly dispose = Disposable.fn();

	// We need this for proxies.
	// Proxies tend to disconnect websocket connections after some time without communication.
	private readonly stayAliveTimer = this.dispose.track(
		new EventTimer(10 * 1000, "started"),
	);

	constructor(
		public readonly serverUrl: string,
		public readonly channel: TypedChannel,
		public readonly stream: WebSocketStream,
	) {
		this.authApi = authContract.getServer(this.channel, {}).server;
		this.mainApi = mainContract.getServer(this.channel, {}).server;
		this.versionApi = versionContract.getServer(this.channel, {}).server;
		this.siteAdminApi = siteAdminContract.getServer(
			this.channel,
			{},
		).server;
		this.dispose.track(stream);

		this.stayAliveTimer.onTick.sub(() => {
			void this.mainApi.ping();
		});

		void stream.onClosed.then(() => {
			this.dispose();
		});
	}
}
