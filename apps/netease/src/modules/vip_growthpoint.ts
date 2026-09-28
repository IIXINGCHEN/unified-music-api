// 会员成长值
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/vipnewcenter/app/level/growhpoint/basic`,
		data,
		createOption(query, "weapi"),
	);
});
