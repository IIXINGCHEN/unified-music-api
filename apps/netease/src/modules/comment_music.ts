// 歌曲评论
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		rid: query.id,
		limit: query.limit || 20,
		offset: query.offset || 0,
		beforeTime: query.before || 0,
	};
	return request(
		`/api/v1/resource/comments/R_SO_4_${query.id}`,
		data,
		createOption(query, "weapi"),
	);
});
