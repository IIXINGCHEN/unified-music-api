/**
 * Module contract for netease API modules.
 *
 * Mirrors the original `module.exports = (query, request) => {...}` shape:
 * every module is a function taking a query bag and the shared createRequest.
 */
import type { createRequest } from "./request.js";

// biome-ignore lint/suspicious/noExplicitAny: query bags are intentionally loose
export type NcmQuery = Record<string, any> & {
	// biome-ignore lint/suspicious/noExplicitAny: task contract pins cookie?: any
	cookie?: any;
	crypto?: string;
	ua?: string;
	proxy?: string;
	realIP?: string;
	ip?: string;
};

export type NcmRequestFn = typeof createRequest;

export type NcmModuleFn<T = unknown> = (
	query: NcmQuery,
	request: NcmRequestFn,
) => Promise<T>;

/**
 * Identity helper that pins the module shape (and its result type) so
 * modules get type checking without changing their runtime form.
 */
export const defineModule = <T = unknown>(fn: NcmModuleFn<T>): NcmModuleFn<T> =>
	fn;
