// 举报评论
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		threadId: `R_SO_4_${query.id}`,
		commentId: query.cid,
		reason: query.reason,
	};
	return request(`/api/report/reportcomment`, data, createOption(query));
});
