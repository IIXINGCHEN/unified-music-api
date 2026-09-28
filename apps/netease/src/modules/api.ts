import {
	cookieToJson,
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const uri = query.uri;
	// biome-ignore lint/suspicious/noExplicitAny: upstream JSON is untyped
	let data: any = {};
	try {
		data =
			typeof query.data === "string"
				? JSON.parse(query.data)
				: query.data || {};
		if (typeof data.cookie === "string") {
			data.cookie = cookieToJson(data.cookie);
			query.cookie = data.cookie;
		}
	} catch {
		data = {};
	}

	const crypto = query.crypto || "";

	const res = request(uri, data, createOption(query, crypto));
	return res;
});
