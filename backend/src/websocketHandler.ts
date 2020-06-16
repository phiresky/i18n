import {
	authContract,
	mainContract,
	siteAdminContract,
	unauthorizedErrorCode,
	versionContract,
} from "@hediet/i18n-api";
import {
	ChannelFactory,
	ConsoleRpcLogger,
	RequestHandlingError,
	StreamBasedChannel,
	TypedChannel,
} from "@hediet/json-rpc";
import { WebSocketStream } from "@hediet/json-rpc-websocket";
import { Facades } from "./db/facade/index.js";
import { Session } from "./db/facade/UserManagementFacade.js";
import { isProduction } from "./env.js";

export class ConnectionContext {
	public session: Session | undefined;

	public requireSession(): Session {
		this.ensureLoggedIn();
		return this.session!;
	}

	public ensureLoggedIn(): void {
		if (!this.session) {
			throw new RequestHandlingError(
				"Request is unauthorized. Login first!",
				undefined,
				unauthorizedErrorCode,
			);
		}
	}
}

export class WebsocketHandler {
	public constructor(private readonly facades: Facades) {}

	public handleStream(stream: WebSocketStream): void {
		const context = new ConnectionContext();
		this.handleChannel(
			StreamBasedChannel.getFactory(
				stream,
				new ConsoleRpcLogger(),
			).mapContext(() => context),
		);
	}

	public handleChannel(channelFactory: ChannelFactory<ConnectionContext>) {
		const channel = new TypedChannel(channelFactory, {
			logger: new ConsoleRpcLogger(),
			ignoreUnexpectedPropertiesInResponses: isProduction(),
		});

		channel.sendExceptionDetails = !isProduction();

		authContract.withContext<ConnectionContext>().registerServer(channel, {
			/* def */ login: async (
				{ usernameOrEmail, password },
				{ context },
			) => {
				const session = await this.facades.userManagement.createSession(
					usernameOrEmail,
					password,
				);
				context.session = session;
				return {
					authToken: session.sessionId,
				};
			},
			/* def */ authenticate: async ({ authToken }, { context }) => {
				context.session =
					await this.facades.userManagement.getSession(authToken);
				if (!context.session) {
					throw new Error("Invalid authToken!");
				}
			},
			changePassword: async (
				{ oldPassword, newPassword },
				{ context },
			) => {
				const { userId, sessionId } = context.requireSession();
				const isOldPasswordValid =
					await this.facades.userManagement.checkPassword(
						userId,
						oldPassword,
					);
				if (!isOldPasswordValid) {
					throw new Error("Old password is invalid!");
				}
				await this.facades.userManagement.setPassword(
					userId,
					newPassword,
				);
				await this.facades.userManagement.deleteUserSessionsExcept(
					userId,
					sessionId,
				);
			},
			/* def */ destroySession: async ({}, { context }) => {
				await this.facades.userManagement.deleteSession(
					context.requireSession().sessionId,
				);
				context.session = undefined;
			},
			/* def */ getCurrentUserInformation: async ({}, { context }) => {
				const userInfo = await this.facades.userManagement.getUserInfo(
					context.requireSession().userId,
				);
				return {
					email: userInfo.email,
					username: userInfo.username,
					isSiteAdmin: userInfo.isSiteAdmin,
				};
			},
		});

		const authenticatedChannel = channel.contextualize<
			{ session: Session },
			void
		>({
			getNewContext: (context) => {
				return { session: context.requireSession() };
			},
			getSendContext: (c) => c,
		});

		const adminSecuredChannel = channel.contextualize<Session, void>({
			getNewContext: async (context) => {
				const session = context.requireSession();
				await this.facades.userManagement.ensureIsSiteAdmin(
					session.userId,
				);
				return session;
			},
			getSendContext: (c) => c,
		});

		siteAdminContract
			.withContext<Session>()
			.registerServer(adminSecuredChannel, {
				/* def */ listUsers: async ({}, { context }) => {
					return await this.facades.userManagement.listAllUsers();
				},
				/* def */ createUser: async (
					{ username, email, isSiteAdmin, password },
					{ context },
				) => {
					await this.facades.userManagement.createUser({
						username,
						email,
						isSiteAdmin,
						password,
					});
				},
				/* def */ deleteUser: async ({ userId }, { context }) => {
					return await this.facades.userManagement.deleteUser(userId);
				},
				/* def */ updateUser: async (
					{ userId, isSiteAdmin, password },
					{ context },
				) => {
					await this.facades.userManagement.updateUser(userId, {
						isSiteAdmin,
						password,
					});
				},
			});

		mainContract.withContext<ConnectionContext>().registerServer(channel, {
			/* def */ ping: async ({}) => {},
			/* def */ getOrganizations: async ({}, { context }) => {
				const orgs = await this.facades.main.getOrganizations(
					context.requireSession(),
				);
				return { orgs };
			},
			/* def */ createVersion: async (
				{ name, orgId, parents, projectId },
				{ context },
			) => {
				context.ensureLoggedIn();

				const version = await this.facades.version.deriveVersion(
					{
						orgId,
						projectId,
					},
					{
						name,
						parents,
					},
				);
				if ("error" in version) {
					throw version;
				}
				return { version };
			},
			getProjectInfo: async ({ orgId, projectId }, { context }) => {
				const info =
					await this.facades.main.getOrganizationMembershipInfo(
						context.requireSession().userId,
						orgId,
					);
				if (!info) {
					throw new Error(
						"Current user is not a member of the requested org",
					);
				}
				return {
					isAdmin: info.isAdmin,
					canConfigureVersion: info.isAdmin,
					canDeleteVersions: info.isAdmin,
					canForkVersion: info.isAdmin,
				};
			},
			createProject: async ({ orgId, projectId }, { context }) => {
				context.ensureLoggedIn();
				const { version } = await this.facades.main.createProject({
					orgId,
					projectId,
				});
				await this.facades.versionLanguages.addLanguage(
					version,
					"en",
					"English",
				);
				return {};
			},

			/* def */ deleteVersion: async ({ version }, { context }) => {
				context.ensureLoggedIn();
				await this.facades.version.deleteVersion(version);
			},
			/* def */ createOrganization: async (
				{ orgId, admins },
				{ context },
			) => {
				context.ensureLoggedIn();
				await this.facades.main.createOrg({ orgId, admins });
			},

			/* def */ deleteOrganization: async ({ orgId }, { context }) => {
				context.ensureLoggedIn();
				await this.facades.main.deleteOrg(orgId);
			},
			/* def */ getOrgMemberships: async ({ orgId }, { context }) => {
				context.ensureLoggedIn();
				return {
					members:
						await this.facades.main.getOrganizationMemberships(
							orgId,
						),
				};
			},
			/* def */ updateOrgMembership: async (
				{ orgId, user, state },
				{ context },
			) => {
				context.ensureLoggedIn();

				let userId: number;
				if ("username" in user) {
					userId = (
						await this.facades.main.findUserIdByUsername(
							user.username,
						)
					).userId;
				} else {
					userId = user.userId;
				}

				await this.facades.main.updateOrgMembership(
					orgId,
					userId,
					state,
				);
			},
		});

		versionContract
			.withContext<{ session: Session }>()
			.registerServer(authenticatedChannel, {
				/* def */ getVersions: async (
					{ orgId, projectId },
					{ newErr, context },
				) => {
					const versions = await this.facades.version.getVersions({
						orgId,
						projectId,
					});
					if ("error" in versions) {
						return newErr({ errorMessage: versions.error });
					}
					return { versions };
				},
				/* def */ exportVersion: async ({ version }, { context }) => {
					const exported =
						await this.facades.version.exportVersion(version);
					return { export: exported };
				},
				/* def */ importVersion: async (
					{ version, import: imported },
					{ context },
				) => {
					await this.facades.version.importVersion(version, imported);
				},
				/* def */ getTranslatablesWithTranslations: async (
					{ version },
					{ context },
				) => {
					return await this.facades.versionTranslations.getTranslatablesWithTranslation(
						version,
					);
				},
				/* def */ postTranslation: async (
					{ version, translatableId, languageCode, translatedFormat },
					{ context },
				) => {
					await this.facades.versionTranslations.postTranslation(
						false, // TODO
						version,
						translatableId,
						languageCode,
						translatedFormat,
					);
				},
				/* def */ getTranslationsForLanguageCode: async (
					{ version, languageCode, requestedPackageIds },
					{ context },
				) => {
					return await this.facades.versionTranslations.getTranslationsForLanguageCode(
						version,
						languageCode,
						requestedPackageIds,
					);
				},
				/* def */ syncTranslatables: async (
					{ update, version },
					{ context },
				) => {
					const result =
						await this.facades.version.updateTranslatables({
							versionRef: version,
							update,
						});
					if ("error" in result) {
						throw result;
					}
					return result;
				},
				/* def */ getVersionInfo: async ({ version }, { context }) => {
					const info =
						await this.facades.version.getVersionInfo(version);
					if ("error" in info) {
						throw new Error(info.error);
					}

					return {
						defaultLanguageCode: info.defaultLangCode,
						languages: info.languages,
						locked: info.locked,
					};
				},
				/* def */ updateVersion: async (
					{ version, defaultLanguageCode, locked },
					{ context },
				) => {
					await this.facades.version.updateVersion(version, {
						defaultLanguageCode,
						locked,
					});
				},
				/* def */ updateLanguage: async (
					{ version, languageCode, details },
					{ context },
				) => {
					await this.facades.versionLanguages.updateLanguage(
						version,
						languageCode,
						details,
					);
				},
				/* def */ deleteLanguage: async (
					{ version, languageCode },
					{ context },
				) => {
					await this.facades.versionLanguages.deleteLanguage(
						version,
						languageCode,
					);
				},
				/* def */ postLanguage: async (
					{ version, languageCode, languageName },
					{ context },
				) => {
					await this.facades.versionLanguages.addLanguage(
						version,
						languageCode,
						languageName,
					);
				},
			});

		channel.startListen();
	}
}
