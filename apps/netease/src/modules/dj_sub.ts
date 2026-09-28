// 订阅与取消电台
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noDoubleEquals: upstream/query values are untyped; loose equality matches original
	query.t = query.t == 1 ? "sub" : "unsub";
	const data = {
		id: query.rid,
	};
	return request(`/api/djradio/${query.t}`, data, createOption(query, "weapi"));
});
