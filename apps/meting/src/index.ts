/**
 * @music-api/meting — library surface.
 * The runnable entrypoint is src/main.ts; the Hono app is built by
 * `createApp()` in src/app.ts.
 */
export { app, createApp } from "./app.js";
export {
	getHost,
	getOverseas,
	getPort,
	getSpotifyApi,
	getYtApi,
} from "./config.js";
export { Providers } from "./providers/index.js";
export type { ProviderHandle, ProviderRegistry } from "./providers/types.js";
export { format as formatLyric } from "./util.js";
