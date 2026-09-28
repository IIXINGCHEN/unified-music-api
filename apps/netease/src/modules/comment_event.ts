// 获取动态评论
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 20,
		offset: query.offset || 0,
		beforeTime: query.before || 0,
	};
	return request(
		`/api/v1/resource/comments/${query.threadId}`,
		data,
		createOption(query, "weapi"),
	);
});
