/** Shared provider contract — port of the implicit shape in src/providers/*.js. */

export interface ProviderHandle {
	/**
	 * Fetch upstream data.
	 * Returns the decoded JSON payload, or -1 when the type is unsupported.
	 */
	handle: (type: string, id: string, cookie?: string) => Promise<unknown>;
	support_type: string[];
}

export interface ProviderRegistry {
	register: (provider_name: string, handle_obj: ProviderHandle) => void;
}
