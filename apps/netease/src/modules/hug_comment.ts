import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
	resourceTypeMap,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	query.type = resourceTypeMap[query.type || 0];
	const threadId = query.type + query.sid;
	const data = {
		targetUserId: query.uid,
		commentId: query.cid,
		threadId: threadId,
	};
	return request(
		`/api/v2/resource/comments/hug/listener`,
		data,
		createOption(query),
	);
});
