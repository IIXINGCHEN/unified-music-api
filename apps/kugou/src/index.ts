/**
 * @music-api/kugou — library surface.
 * The runnable entrypoint is src/main.ts (`startService()`); the Hono app is
 * built by `constructServer()` in src/server.ts.
 */

export type {
	KugouServerExtension,
	KugouVariables,
	LoadedModuleDef,
} from "./server.js";
export {
	constructServer,
	getModuleDefinitions,
	startService,
} from "./server.js";
