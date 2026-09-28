import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		compose_reminder: "true",
		compose_hot_comment: "true",
		limit: query.limit || 10,
		user_id: query.uid,
		time: query.time || 0,
	};
	return request(
		`/api/comment/user/comment/history`,
		data,
		createOption(query, "weapi"),
	);
});
