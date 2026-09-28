// 收藏与取消收藏歌单
import {
	APP_CONF,
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noDoubleEquals: query/upstream values are untyped; loose equality matches original
	const path = query.t == 1 ? "subscribe" : "unsubscribe";
	const data = {
		id: query.id,
		...(query.t === 1
			? { checkToken: query.checkToken || APP_CONF.checkToken }
			: {}),
	};
	query.checkToken = "v2"; // 强制开启checkToken
	return request(`/api/playlist/${path}`, data, createOption(query, "eapi"));
});
