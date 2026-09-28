/**
 * Ambient declarations for optional third-party packages that some netease
 * modules load lazily (dynamic import). They are NOT installed in this
 * workspace; modules degrade or throw exactly where the original `require`
 * would have thrown. If a package is added as a dependency later, the real
 * types take precedence over these shims.
 */
declare module "qrcode" {
	// biome-ignore lint/suspicious/noExplicitAny: third-party shim
	const QRCode: any;
	export default QRCode;
}

declare module "music-metadata" {
	// biome-ignore lint/suspicious/noExplicitAny: third-party shim
	const mm: any;
	export default mm;
}

declare module "@neteasecloudmusicapienhanced/unblockmusic-utils" {
	// biome-ignore lint/suspicious/noExplicitAny: third-party shim
	export function matchID(...args: any[]): Promise<any>;
	// biome-ignore lint/suspicious/noExplicitAny: third-party shim
	const def: any;
	export default def;
}

declare module "jsdom" {
	// biome-ignore lint/suspicious/noExplicitAny: third-party shim
	const JSDOM: any;
	// biome-ignore lint/suspicious/noExplicitAny: third-party shim
	const VirtualConsole: any;

	export { JSDOM, VirtualConsole };
}
