// 云小编抽奖剩余次数查询
//
// activityId:
// 默认 6501202
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		activityId: query.activityId || "6501202",
	};
	return request(
		`/api/middle/play/lottery/remain/chance`,
		data,
		createOption(query, "eapi"),
	);
});
