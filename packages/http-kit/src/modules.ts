/**
 * Module auto-registration — port of getModulesDefinitions() in both servers.
 *
 * Original rules:
 * - Read the module dir, REVERSE the file list (matches app.js load order).
 * - netease: keep every `.js` file; kugou: keep `.js` files NOT starting
 *   with '_' (underscore-prefixed = internal helpers, never registered).
 * - Route: specificRoute map wins (keyed by file name), else
 *   '/' + basename-minus-ext with '_' → '/'.
 * - identifier: file name minus extension.
 *
 * In v2 the sources are `.ts`; this scanner defaults to `.ts` (dev/tsx) but
 * accepts an `ext` override (e.g. '.js' for compiled dist/).
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

export interface ModuleDef {
	identifier: string;
	route: string;
	/** Absolute file path (the app dynamic-imports it). */
	file: string;
}

export interface ScanOptions {
	/** Kugou behavior: skip files starting with '_' (default false). */
	skipUnderscore?: boolean;
	/** e.g. netease: { 'daily_signin.js': '/daily_signin', ... } — keyed by file name. */
	special?: Record<string, string>;
	/** File extension to scan (default '.ts'). */
	ext?: string;
}

/** Route for one file name (no directory), mirroring parseRoute(). */
export function routeForFile(
	fileName: string,
	special: Record<string, string> | undefined,
	ext: string,
): string {
	if (special && fileName in special) return special[fileName];
	const base = fileName.endsWith(ext)
		? fileName.slice(0, -ext.length)
		: fileName;
	return `/${base.replace(/_/g, "/")}`;
}

export function scanModuleFiles(
	dir: string,
	opts: ScanOptions = {},
): ModuleDef[] {
	const ext = opts.ext ?? ".ts";
	const skipUnderscore = opts.skipUnderscore ?? false;
	return readdirSync(dir)
		.reverse()
		.filter((f) => f.endsWith(ext) && (!skipUnderscore || !f.startsWith("_")))
		.map((f) => ({
			identifier: f.slice(0, -ext.length),
			route: routeForFile(f, opts.special, ext),
			file: join(dir, f),
		}));
}
