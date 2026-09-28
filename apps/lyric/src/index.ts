/**
 * Lyric Atlas API — Hono app (Node port).
 *
 * Ported from Lyric-Atlas-API/api/index.ts (Vercel Edge). Behavioral notes:
 * - Edge-only pieces removed: `hono/vercel` handle(), `runtime`,
 *   `preferredRegion`, `config` exports.
 * - `basePath("/api")` kept: public paths unchanged (/api, /api/search,
 *   /api/lyrics/meta).
 * - Cache cleanup interval is unref'd so it never keeps the process (or
 *   vitest) alive on its own; the running server keeps the loop alive.
 */

import type { Context } from "hono";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import type { StatusCode } from "hono/utils/http-status";
import { setupCacheCleanup } from "./cache.js";
import {
	getLyricMetadata,
	type LyricMetadataResult,
	LyricProvider,
	type SearchResult,
} from "./lyricService.js";
import { getLogger } from "./utils.js";

const apiLogger = getLogger("API");

// Console logger shim passed to the lyric service functions.
const consoleLoggerShim = {
	info: (...args: unknown[]) => apiLogger.info(...args),
	warn: (...args: unknown[]) => apiLogger.warn(...args),
	error: (...args: unknown[]) => apiLogger.error(...args),
	debug: (...args: unknown[]) => apiLogger.debug(...args),
};

function getExternalApiBaseUrl(): string | undefined {
	const url = process.env.EXTERNAL_NCM_API_URL;
	if (!url) {
		apiLogger.error(
			"Server configuration error: EXTERNAL_NCM_API_URL is not set in environment.",
		);
	}
	return url;
}

export function createApp(): Hono {
	const app = new Hono();

	app.get("/health", (c) => c.json({ status: "ok", service: "lyric" }));

	const api = app.basePath("/api");

	api.use(
		"*",
		cors({
			origin: "*",
			allowMethods: ["GET", "OPTIONS"],
		}),
	);

	api.use("*", prettyJSON());

	api.get("/", (c) => {
		apiLogger.info("Root endpoint accessed.");
		return c.json({ message: "Lyric Atlas API is running." });
	});

	// Search route using LyricProvider
	api.get("/search", async (c: Context) => {
		const id = c.req.query("id");
		const fallbackQuery = c.req.query("fallback");
		const fixedVersionRaw = c.req.query("fixedVersion");

		apiLogger.info(
			`Search request - ID: ${id}, Fixed: ${fixedVersionRaw}, Fallback: ${fallbackQuery}`,
		);

		const externalApiBaseUrl = getExternalApiBaseUrl();

		if (!externalApiBaseUrl) {
			c.status(500);
			return c.json({ found: false, id, error: "Server configuration error." });
		}

		if (!id) {
			apiLogger.warn("Search failed: Missing id parameter.");
			c.status(400);
			return c.json({ found: false, error: "Missing id parameter" });
		}

		try {
			const lyricProvider = new LyricProvider(externalApiBaseUrl);

			const result: SearchResult = await lyricProvider.search(id, {
				fixedVersion: fixedVersionRaw,
				fallback: fallbackQuery,
			});

			if (result.found) {
				apiLogger.info(
					`Lyrics found for ID: ${id} - Format: ${result.format}, Source: ${result.source}`,
				);
				if (result.translation)
					apiLogger.debug(`Translation found for ID: ${id}`);
				if (result.romaji) apiLogger.debug(`Romaji found for ID: ${id}`);
				return c.json(result);
			}
			const statusCode = result.statusCode || 404;
			c.status(statusCode as StatusCode);
			apiLogger.info(
				`Lyrics not found for ID: ${id} - Status: ${statusCode}, Error: ${result.error}`,
			);
			return c.json(result);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown processing error";
			apiLogger.error(
				`Unexpected error during search for ID: ${id} - ${errorMessage}`,
				error,
			);
			c.status(500);
			return c.json({
				found: false,
				id,
				error: `Failed to process lyric request: ${errorMessage}`,
			});
		}
	});

	// API Endpoint: /api/lyrics/meta
	api.get("/lyrics/meta", async (c) => {
		const id = c.req.query("id");

		if (!id) {
			c.status(400);
			return c.json({ found: false, error: "Missing id parameter" });
		}

		apiLogger.info(`Received metadata request for ID: ${id}`);

		try {
			const result: LyricMetadataResult = await getLyricMetadata(id, {
				logger: consoleLoggerShim,
			});

			if (result.found) {
				apiLogger.info(
					`Found metadata for ID: ${id}, Formats: ${result.availableFormats.join(", ")}`,
				);
				return c.json(result);
			}
			const statusCode = result.statusCode || 404;
			apiLogger.warn(
				`Metadata not found or error for ID: ${id}. Status: ${statusCode}, Error: ${result.error}`,
			);
			c.status(statusCode as StatusCode);
			return c.json(result);
		} catch (error) {
			const err = error instanceof Error ? error : new Error(String(error));
			apiLogger.error({
				msg: `Unexpected error during API metadata handler for ID: ${id}`,
				error: err.message,
				stack: err.stack,
			});
			c.status(500);
			return c.json({
				found: false,
				id,
				error: `Failed to process lyric metadata request: ${err.message}`,
			});
		}
	});

	return app;
}

// Start the periodic cache cleanup (unref'd: never keeps the process alive
// on its own; a running server keeps the event loop alive anyway).
const cleanupTimer = setupCacheCleanup() as unknown as {
	unref?: () => void;
};
cleanupTimer.unref?.();

export const app = createApp();
export default app;
