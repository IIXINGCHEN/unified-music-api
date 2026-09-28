// 云村星评馆 - 简要评论列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		cursor: JSON.stringify({
			offset: 0,
			blockCodeOrderList: ["HOMEPAGE_BLOCK_NEW_HOT_COMMENT"],
			refresh: true,
		}),
	};
	return request(`/api/homepage/block/page`, data, createOption(query));
});
