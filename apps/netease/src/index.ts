/**
 * Library entry — port of api-enhanced/main.js's server-related exports.
 * (Per-module function exports from main.js are out of scope for the v2
 * HTTP service; see docs/parity-p3-netease.md.)
 */

export { generateConfig } from "./generateConfig.js";
export {
	constructServer,
	getModuleDefinitions,
	type NcmApiOptions,
	type NcmModuleDef,
	serveNcmApi,
} from "./server.js";
