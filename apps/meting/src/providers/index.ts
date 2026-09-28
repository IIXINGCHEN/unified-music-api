/**
 * Provider registry — port of src/providers/index.js.
 *
 * P4 scope decision: only spotify + ytmusic are ported. The tencent and
 * netease providers are dropped (covered by the native kugou/netease
 * services); the default server in service/api.ts changed accordingly.
 */
import spotify from "./spotify.js";
import type { ProviderHandle } from "./types.js";
import ytmusic from "./ytmusic.js";

export class Providers {
	private providers: Record<string, ProviderHandle> = {};

	constructor() {
		spotify.register(this);
		ytmusic.register(this);
	}

	register(provider_name: string, handle_obj: ProviderHandle): void {
		this.providers[provider_name] = handle_obj;
	}

	get(provider_name: string): ProviderHandle | undefined {
		return this.providers[provider_name];
	}

	get_provider_list(): string[] {
		return Object.keys(this.providers);
	}
}

export default Providers;
