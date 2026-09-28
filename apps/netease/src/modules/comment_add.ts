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
		content: query.content,
		resourceType: "0",
		expressionPicId: "-1",
		bubbleId: "-1",
	};
	return request(
		`/api/resource/comments/add`,
		data,
		createOption(query, "xeapi", "v3"),
	);
});
