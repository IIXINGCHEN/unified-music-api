// MV 点赞转发评论数数据
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		threadid: `R_MV_5_${query.mvid}`,
		composeliked: true,
	};
	return request(
		`/api/comment/commentthread/info`,
		data,
		createOption(query, "weapi"),
	);
});
