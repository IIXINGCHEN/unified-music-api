// 云小编每日抽奖
//
// activityId:
// 默认 6501202
//
// drawCount:
// 默认 1
//
// checkToken:
// 易盾反作弊 Token
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		activityId: query.activityId || "6501202",
		drawCount: query.drawCount || "1",
	};
	return request(
		`/api/middle/play/do/lottery`,
		data,
		createOption(query, "eapi", "v2"),
	);
});
