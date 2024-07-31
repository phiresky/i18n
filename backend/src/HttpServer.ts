import {
	getBestFittingLanguage,
	sessionTokenCookieName,
	sTranslationsForLanguageCode,
} from "@hediet/i18n-api";
import { distPath } from "@hediet/i18n-frontend";
import { ChannelFactory, JSONObject } from "@hediet/json-rpc";
import { WebSocketStream } from "@hediet/json-rpc-websocket";
import {
	ConservativeFlattenedEntryParser,
	FlattenToDictionary,
} from "@hediet/json-to-dictionary";
import cors from "@koa/cors";
import Koa from "koa";
import historyApiFallback from "koa-history-api-fallback";
import Router from "koa-router";
import koaStatic from "koa-static";
import WebSocket from "ws";
import { Facades } from "./db/facade/index.js";
import { ConnectionContext, WebsocketHandler } from "./websocketHandler.js";

export class HttpServer {
	constructor(
		private readonly websocketHandler: WebsocketHandler,
		private readonly facades: Facades,
	) {
		const app = new Koa();
		const router = new Router();

		const flattener = new FlattenToDictionary({
			parser: new ConservativeFlattenedEntryParser({}),
		});

		this.websocketHandler.handleChannel(
			new ChannelFactory((listener) => {
				let id = 1;
				router.all("/api/:path*", async (ctx) => {
					const isSameOriginCall = ctx.href.startsWith(ctx.origin);
					if (!isSameOriginCall) {
						ctx.body = { error: "cors not supported yet" };
						return;
					}

					const context = new ConnectionContext();

					const sessionToken = ctx.cookies.get(
						sessionTokenCookieName,
					);
					if (sessionToken !== undefined) {
						const session =
							await facades.userManagement.getSession(
								sessionToken,
							);
						context.session = session;
					}

					const prevSession = context.session;

					const args = flattener.unflatten(
						ctx.query as Record<string, string>,
					);
					if (!listener) throw Error("listener is undefined");
					const result = await listener.handleRequest(
						{
							method: ctx.params["path"],
							params: args as JSONObject,
						},
						id++,
						context,
					);

					if ("result" in result) {
						ctx.body = result;
					} else {
						ctx.status = 500;
						ctx.body = result.error;
					}

					if (context.session !== prevSession) {
						if (context.session) {
							ctx.cookies.set(
								sessionTokenCookieName,
								context.session.sessionId,
							);
						} else {
							ctx.cookies.set(sessionTokenCookieName);
						}
					}
				});

				return {
					sendNotification: null!,
					sendRequest: null!,
					toString: () => "Koa Http Server",
				};
			}),
		);

		this.addPublicApi(router);

		app.use(
			cors({
				origin: "*",
			}),
		);

		app.use(router.routes());
		app.use(router.allowedMethods());
		app.use(
			// this proxies all paths that don't contain a "." to /index.html
			historyApiFallback({
				index: "/index.html",
			}),
		);
		app.use(koaStatic(distPath, {}));

		const port = +(process.env.LISTEN_PORT || 5000);
		const server = app.listen(port);
		console.log("listening on port", port);

		const wss = new WebSocket.Server({ noServer: true });
		wss.on("connection", (ws) => {
			ws.on("error", (err) => {
				console.error(err);
			});
			websocketHandler.handleStream(
				new WebSocketStream(
					ws as unknown as import("@hediet/json-rpc-websocket/node_modules/@types/ws/index.js"),
				),
			);
		});

		server.on("upgrade", function upgrade(request, socket, head) {
			wss.handleUpgrade(request, socket, head, function done(ws) {
				wss.emit("connection", ws, request);
			});
		});
	}

	private sendCacheControlHeaders(
		ctx: Koa.ParameterizedContext<any, Router.IRouterParamContext<any>>,
	) {
		const secondsIn1Month = 30 * 24 * 60 * 60;
		ctx.set(
			"Cache-Control",
			`public,max-age=100,stale-if-error=${secondsIn1Month},stale-while-revalidate=${secondsIn1Month}`,
		);
	}

	private addPublicApi(router: Router<any>) {
		router.get(
			"/orgs/:org/projects/:proj/versions/:version/languages",
			async (ctx, next) => {
				this.sendCacheControlHeaders(ctx);

				const params = ctx.params as {
					org: string;
					proj: string;
					version: string;
				};

				const versionInfo = await this.facades.version.getVersionInfo({
					orgId: params.org,
					projectId: params.proj,
					versionId: params.version,
				});

				if ("error" in versionInfo) {
					throw new Error("invalid version");
				}

				ctx.body = {
					supportedLanguages: versionInfo.languages
						.filter((l) => l.published)
						.map((language) => ({
							languageCode: language.languageCode,
						})),
				};
			},
		);

		router.get(
			"/orgs/:org/projects/:proj/versions/:version/translations/:lang",
			async (ctx, next) => {
				this.sendCacheControlHeaders(ctx);

				const params = ctx.params as {
					org: string;
					proj: string;
					version: string;
					lang: string;
				};

				const foo = this.facades.versionTranslations;

				const result = await foo.getTranslationsForLanguageCode(
					{
						orgId: params.org,
						projectId: params.proj,
						versionId: params.version,
					},
					params.lang,
					undefined,
				);

				ctx.body = sTranslationsForLanguageCode.serialize(result);
			},
		);

		router.get(
			"/orgs/:org/projects/:proj/versions/:version/translations",
			async (ctx, next) => {
				this.sendCacheControlHeaders(ctx);

				const params = ctx.params as {
					org: string;
					proj: string;
					version: string;
				};

				const lang = String(ctx.query["lang"]);
				const acceptedLanguageCodes = lang.toLowerCase().split(",");
				if (acceptedLanguageCodes.length === 0) {
					throw new Error("Invalid query parameter 'lang'");
				}

				const versionInfo = await this.facades.version.getVersionInfo({
					orgId: params.org,
					projectId: params.proj,
					versionId: params.version,
				});

				if ("error" in versionInfo) {
					throw new Error("invalid version");
				}
				const langCodeToReturn = getBestFittingLanguage({
					supportedLanguageCodes: versionInfo.languages
						.filter((l) => l.published)
						.map((l) => l.languageCode),
					acceptedLanguageCodes,
					fallbackLanguageCode: versionInfo.defaultLangCode,
				});
				if (!langCodeToReturn) {
					throw new Error("No supported language");
				}

				const result =
					await this.facades.versionTranslations.getTranslationsForLanguageCode(
						{
							orgId: params.org,
							projectId: params.proj,
							versionId: params.version,
						},
						langCodeToReturn,
						undefined,
					);

				ctx.body = sTranslationsForLanguageCode.serialize(result);
			},
		);
	}
}
