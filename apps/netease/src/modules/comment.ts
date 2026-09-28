// 发送与删除评论
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
	resourceTypeMap,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const commentActionMap: Record<string, string> = {
		1: "add",
		0: "delete",
		2: "reply",
	};
	query.t = commentActionMap[query.t];
	query.type = resourceTypeMap[query.type];
	// biome-ignore lint/suspicious/noExplicitAny: upstream JSON is untyped
	const data: Record<string, any> = {
		threadId: query.type + query.id,
	};

	if (query.type === "A_EV_2_") {
		data.threadId = query.threadId;
	}
	if (query.t === "add") data.content = query.content;
	else if (query.t === "delete") data.commentId = query.commentId;
	else if (query.t === "reply") {
		data.commentId = query.commentId;
		data.content = query.content;
	}
	return request(
		`/api/resource/comments/${query.t}`,
		data,
		createOption(query, "eapi", "v2"),
	);
});
