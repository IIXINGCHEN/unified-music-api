// 云小编领取一日会员
//
// 注：前提条件见 rep/ugc/user/vip
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
		`/api/rep/ugc/user/collect-vip`,
		data,
		createOption(query, "eapi"),
	);
});
