/**
 * Runtime config — port of Meting-API/src/config.js.
 *
 * The original read env vars once at module load (probing Deno.env first);
 * this port targets Node.js only and reads lazily (identical observable
 * behavior in production, overridable in tests). Accesses process via
 * globalThis so no @types/node dependency is required.
 */

interface NodeProcess {
	env: Record<string, string | undefined>;
}

function nodeProcess(): NodeProcess | undefined {
	const g = globalThis as Record<string, unknown>;
	const p = g.process as NodeProcess | undefined;
	return p && typeof p.env === "object" ? p : undefined;
}

function env(name: string): string | undefined {
	return nodeProcess()?.env[name];
}

export function getOverseas(): boolean {
	return Boolean(env("OVERSEAS"));
}

export function getPort(): number {
	return Number(env("PORT") || "3000");
}

export function getHost(): string {
	return env("HOST") || "";
}

/**
 * Upstream API base for the spotify provider.
 * Original fallback chain: SPOTIFY_API -> YT_API.
 */
export function getSpotifyApi(): string {
	return env("SPOTIFY_API") || env("YT_API") || "";
}

/** Upstream API base for the ytmusic provider. */
export function getYtApi(): string {
	return env("YT_API") || "";
}
