import { prop, sBoolean, sObject, sString } from "@hediet/semantic-json";
import { EventTimer } from "@hediet/std/timer";
import {
	action,
	autorun,
	computed,
	makeObservable,
	observable,
	reaction,
	when,
} from "mobx";
import { fromPromise } from "mobx-utils";
import { getEmbeddedTranslationEditorSocket } from "../../../embedded-editor";
import {
	VisibleTranslation,
	VisibleTranslationFinder,
} from "../components/VisibleTranslationFinder";
import { Point } from "../utils/Point";
import { I18nClient } from "./I18nClient";
import { Translations } from "./Translations";

export class Model {
	@observable enabled = true;
	@observable widgetOffset = Point.Zero;
	@observable translatablesHighlighted = false;
	@observable showTranslatableMarkers = false;

	@action.bound
	public highlightTranslatables(): void {
		this.visibleTranslationFinder.updateTranslatables();
		this.translatablesHighlighted = !this.translatablesHighlighted;
		this.settingsActive = false;
	}

	@action.bound
	public close(): void {
		if (this.socket) {
			this.socket.close();
		}
	}

	@action
	public toggleEnabled() {
		this.enabled = !this.enabled;
	}

	@observable lastServerUrl: string | undefined;
	@observable lastAuthToken: string | undefined;

	public readonly client = new I18nClient({
		getAuthToken: (serverUrl) => {
			if (this.lastServerUrl === serverUrl) {
				return this.lastAuthToken;
			}
			return undefined;
		},
		setAuthToken: (serverUrl, authToken) => {
			action("Update server url & auth token", () => {
				this.lastServerUrl = serverUrl;
				this.lastAuthToken = authToken;
			})();
		},
	});

	@observable settingsActive = true;

	@action.bound
	public toggleSettings(): void {
		this.settingsActive = !this.settingsActive;
		this.translatablesHighlighted = false;
	}

	@computed get currentPage():
		| { kind: "connect" }
		| { kind: "language-selection" }
		| { kind: "main" } {
		return this.settingsActive
			? this.client.connection
				? { kind: "language-selection" }
				: {
						kind: "connect",
				  }
			: {
					kind: "main",
			  };
	}

	public async connect(
		serverUrl: string,
		username: string,
		password: string,
	): Promise<void> {
		this.lastAuthToken = undefined;
		await this.client.connect(serverUrl);
		await this.client.login(username, password);
	}

	@action.bound
	public disconnect(): void {
		this.lastAuthToken = undefined;
		this.client.disconnect();
	}

	public readonly settings = new SettingsModel();

	@observable selectedVisibleTranslation: VisibleTranslation | undefined;
	public readonly visibleTranslationFinder = new VisibleTranslationFinder();

	constructor() {
		makeObservable(this);
		this.loadConfig();

		reaction(
			() =>
				configType.serialize({
					authToken: this.lastAuthToken,
					serverUrl: this.lastServerUrl,
					organizationId: this.settings.organizationId,
					projectId: this.settings.projectId,
					versionId: this.settings.versionId,
					languageCode: this.settings.languageCode,
					showTranslatableMarker: this.showTranslatableMarkers,
					enabled: this.enabled,
				}),
			(data) => {
				localStorage.setItem("i18nEditorConfig", JSON.stringify(data));
			},
			{ name: "Update Config" },
		);

		void this.init();

		const timer = new EventTimer(300, "stopped");
		timer.onTick.sub(() => {
			this.visibleTranslationFinder.updateTranslatables();
		});
		autorun(() => {
			if (this.translatablesHighlighted) {
				timer.start();
			} else {
				timer.stop();
			}
		});
	}

	loadConfig(): void {
		const jsonSrc = localStorage.getItem("i18nEditorConfig");
		if (!jsonSrc) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const config = configType.deserialize(JSON.parse(jsonSrc)).value;

		this.lastAuthToken = config.authToken;
		this.lastServerUrl = config.serverUrl;
		this.showTranslatableMarkers = config.showTranslatableMarker || false;

		this.enabled = config.enabled;

		this.settings.organizationId = config.organizationId;
		this.settings.projectId = config.projectId;
		this.settings.versionId = config.versionId;
		this.settings.languageCode = config.languageCode;
	}

	private readonly socket = getEmbeddedTranslationEditorSocket();

	@computed get translations() {
		type State =
			| { kind: "loaded"; value: Translations }
			| { kind: "loading" }
			| { kind: "invalid"; error: any };

		const p = fromPromise(
			(async (): Promise<State> => {
				if (!this.client.connection || !this.client.loggedIn) {
					return {
						kind: "invalid",
						error: "no connection or not logged in",
					};
				}
				const translations =
					await this.client.connection.versionApi.getTranslatablesWithTranslations(
						{
							version: {
								orgId: this.settings.organizationId!,
								projectId: this.settings.projectId!,
								versionId: this.settings.versionId!,
							},
						},
					);
				return {
					kind: "loaded",
					value: new Translations(translations, this),
				};
			})(),
		);

		return computed(() =>
			p.case<State>({
				fulfilled: (v) => v,
				pending: () => ({ kind: "loading" }),
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				rejected: (error: any) => ({ kind: "invalid", error }),
			}),
		);
	}

	async init(): Promise<void> {
		autorun(() => {
			// this triggers a keep alive
			this.translations.get();
		});

		if (this.lastServerUrl && this.lastAuthToken) {
			await this.client.connect(this.lastServerUrl);
			await when(() => this.translations.get().kind !== "loading");
		}

		autorun(
			() => {
				const translations = this.translations.get();

				if (translations.kind === "invalid") {
					console.error(
						"I18n embedded editor got invalid data",
						translations.error,
					);
				}

				if (
					!this.socket ||
					translations.kind !== "loaded" ||
					!this.settings.languageCode
				) {
					return;
				}

				const localeTranslations = translations.value
					.getLanguage(this.settings.languageCode)
					.renderTranslations();
				JSON.stringify(localeTranslations); // this triggers a deep mobx dependency

				this.socket.set(localeTranslations);
			},
			{ name: "model rebuild" },
		);

		if (this.socket) {
			this.socket.initialized();
		}
	}
}

export const configType = sObject({
	serverUrl: prop(sString(), { optional: true }),
	authToken: prop(sString(), { optional: true }),
	organizationId: prop(sString(), { optional: true }),
	projectId: prop(sString(), { optional: true }),
	versionId: prop(sString(), { optional: true }),
	languageCode: prop(sString(), { optional: true }),
	showTranslatableMarker: prop(sBoolean(), {
		optional: true,
	}),
	enabled: prop(sBoolean(), {
		optional: { withDefault: true },
	}),
});

export class SettingsModel {
	@observable organizationId: string | undefined;
	@observable versionId: string | undefined;
	@observable projectId: string | undefined;
	@observable languageCode: string | undefined;

	constructor() {
		makeObservable(this);
	}

	@action
	public setOrganizationId(organizationId: string): void {
		this.organizationId = organizationId;
		this.setProjectId(undefined);
	}

	@action
	public setProjectId(project: string | undefined): void {
		this.projectId = project;
		this.setVersionId(undefined);
	}

	@action
	public setVersionId(version: string | undefined): void {
		this.versionId = version;
		this.setLanguageCode(undefined);
	}

	@action
	public setLanguageCode(languageCode: string | undefined): void {
		this.languageCode = languageCode;
	}
}
