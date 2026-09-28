// 发送评论
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
	resourceTypeMap,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		threadId: resourceTypeMap[query.type] + query.id,
		commentId: query.cid,
		content: query.content,
		resourceType: "0",
	};
	return request(
		`/api/v1/resource/comments/reply`,
		data,
		createOption(query, "xeapi", "v3"),
	);
});
