import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
	resourceTypeMap,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	query.type = resourceTypeMap[query.type];
	const data = {
		parentCommentId: query.parentCommentId,
		threadId: query.type + query.id,
		time: query.time || -1,
		limit: query.limit || 20,
	};
	return request(
		`/api/resource/comment/floor/get`,
		data,
		createOption(query, "weapi"),
	);
});
