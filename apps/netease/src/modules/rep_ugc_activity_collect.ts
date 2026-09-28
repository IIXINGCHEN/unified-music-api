// 云小编领取任务积分
//
// activityId:
// 调用 rep/ugc/activity/get 获取
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		activityId: query.activityId || "5001",
	};
	return request(
		`/api/rep/ugc/activity/collect`,
		data,
		createOption(query, "eapi"),
	);
});
