// 收藏与取消收藏歌手
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
		artistId: query.id,
		artistIds: `[${query.id}]`,
	};
	return request(`/api/artist/${query.t}`, data, createOption(query, "weapi"));
});
