/**
 * Ambient declaration for @neteasecloudmusicapienhanced/unblockmusic-utils,
 * which ships no TypeScript types. The package IS a real dependency (dynamic
 * import in song_url_v1 / song_url_match); this only covers its shape.
 */
declare module "@neteasecloudmusicapienhanced/unblockmusic-utils" {
	// biome-ignore lint/suspicious/noExplicitAny: third-party without types
	export function matchID(...args: any[]): Promise<any>;
	// biome-ignore lint/suspicious/noExplicitAny: third-party without types
	const def: any;
	export default def;
}
