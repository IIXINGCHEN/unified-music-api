// 热门评论
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
		rid: query.id,
		limit: query.limit || 20,
		offset: query.offset || 0,
		beforeTime: query.before || 0,
	};
	return request(
		`/api/v1/resource/hotcomments/${query.type}${query.id}`,
		data,
		createOption(query, "weapi"),
	);
});
