// 领取云豆
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		userMissionId: query.id,
		period: query.period,
	};
	return request(
		`/api/nmusician/workbench/mission/reward/obtain/new`,
		data,
		createOption(query, "weapi"),
	);
});
