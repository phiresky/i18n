declare module "koa-history-api-fallback" {
	import { Middleware } from "koa";
	const x: ({ index: string }) => Middleware;
	export = x;
}
