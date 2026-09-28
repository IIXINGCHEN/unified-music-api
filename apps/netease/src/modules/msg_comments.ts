// 评论
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		beforeTime: query.before || "-1",
		limit: query.limit || 30,
		total: "true",
		uid: query.uid,
	};

	return request(
		`/api/v1/user/comments/${query.uid}`,
		data,
		createOption(query, "weapi"),
	);
});
