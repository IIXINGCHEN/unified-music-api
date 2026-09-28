// 删除评论
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
	resourceTypeMap,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		commentId: query.cid,
		threadId: resourceTypeMap[query.type] + query.id,
	};
	return request(
		`/api/resource/comments/delete`,
		data,
		createOption(query, "xeapi"),
	);
});
