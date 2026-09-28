// 获取用户的创建歌单列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || "100",
		offset: query.offset || "0",
		userId: query.uid,
		isWebview: "true",
		includeRedHeart: "true",
		includeTop: "true",
	};
	return request(`/api/user/playlist/create`, data, createOption(query));
});
