/**
 * Spotify provider — port of src/providers/spotify/index.js.
 * Upstream base URL from SPOTIFY_API (falls back to YT_API), see config.ts.
 */
import { getSpotifyApi } from "../config.js";
import type { ProviderHandle, ProviderRegistry } from "./types.js";

const support_type = ["song", "playlist"];

const handle: ProviderHandle["handle"] = async (type, id, _cookie = "") => {
	const base = getSpotifyApi();
	if (!support_type.includes(type)) {
		return -1;
	}
	const result = await fetch(`${base}?server=spotify&type=${type}&id=${id}`);
	return result.json();
};

export const spotifyProvider: ProviderHandle = { handle, support_type };

export default {
	register: (ctx: ProviderRegistry): void => {
		ctx.register("spotify", spotifyProvider);
	},
};
