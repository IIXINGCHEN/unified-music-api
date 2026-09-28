/**
 * Ambient declaration for the optional `undici` dependency.
 *
 * request.ts dynamically imports('undici') only when a proxy is configured.
 * This declaration keeps typecheck green when undici is NOT installed
 * (the runtime import simply fails and is handled gracefully).
 * If `undici` is ever added as a real dependency, remove this file so the
 * package's own types take over.
 */
declare module "undici" {
	export class ProxyAgent {
		constructor(url: string | URL);
	}
}
