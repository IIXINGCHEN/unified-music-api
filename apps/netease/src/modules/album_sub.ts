// 收藏/取消收藏专辑
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noDoubleEquals: query params arrive as strings; loose equality is intentional (matches original)
	query.t = query.t == 1 ? "sub" : "unsub";
	const data = {
		id: query.id,
	};
	return request(`/api/album/${query.t}`, data, createOption(query, "weapi"));
});
