/**
 * @music-api/http-kit — shared Hono server middleware for the v2 music API.
 *
 * Ports of the Express middleware/behaviors found in:
 *   - api-enhanced/server.js (+ util/apicache.js)
 *   - KuGouMusicApi/server.js (+ util/apicache.js)
 *
 * Every export documents the exact original behavior it replicates, including
 * known quirks (apicache keys, cookie regex). Intentional deviations are marked
 * with "DEVIATION" and listed in docs/parity.md.
 */

export { type CacheConfig, responseCache } from "./cache.js";
export { cookieMiddleware, parseCookieHeader, safeDecode } from "./cookie.js";
export {
	type CorsConfig,
	corsMiddleware,
	parseCorsAllowOrigins,
} from "./cors.js";
export {
	type ModuleDef,
	routeForFile,
	type ScanOptions,
	scanModuleFiles,
} from "./modules.js";
export {
	type MultipartOptions,
	type MultipartResult,
	parseMultipart,
	type UploadedFileShape,
} from "./multipart.js";
export { getClientIp } from "./net.js";
