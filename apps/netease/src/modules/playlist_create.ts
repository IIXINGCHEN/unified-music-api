// 创建歌单
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		name: query.name,
		privacy: query.privacy || "0", // 0 普通歌单, 10 隐私歌单
		type: query.type || "NORMAL", // 默认 NORMAL, VIDEO 视频歌单, SHARED 共享歌单
	};
	return request(`/api/playlist/create`, data, createOption(query, "weapi"));
});
