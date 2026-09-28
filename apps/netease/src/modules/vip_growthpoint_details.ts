// 会员成长值领取记录
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 20,
		offset: query.offset || 0,
	};
	return request(
		`/api/vipnewcenter/app/level/growth/details`,
		data,
		createOption(query, "weapi"),
	);
});
