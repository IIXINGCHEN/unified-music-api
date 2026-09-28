// 收藏与取消收藏MV
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noDoubleEquals: query/upstream values are untyped; loose equality matches original
	query.t = query.t == 1 ? "sub" : "unsub";
	const data = {
		mvId: query.mvid,
		mvIds: `["${query.mvid}"]`,
	};
	return request(`/api/mv/${query.t}`, data, createOption(query, "weapi"));
});
