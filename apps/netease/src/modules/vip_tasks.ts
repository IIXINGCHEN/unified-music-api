// 会员任务
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/vipnewcenter/app/level/task/list`,
		data,
		createOption(query, "weapi"),
	);
});
