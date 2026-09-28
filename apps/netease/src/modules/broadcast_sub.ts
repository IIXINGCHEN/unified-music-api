// 广播电台 - 收藏/取消收藏电台
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noDoubleEquals: query params arrive as strings; loose equality is intentional (matches original)
	query.t = query.t == 1 ? "false" : "true";
	const data = {
		contentType: "BROADCAST",
		contentId: query.id,
		cancelCollect: query.t,
	};
	return request(`/api/content/interact/collect`, data, createOption(query));
});
