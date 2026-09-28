// 领取会员成长值
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		taskIds: query.ids,
	};
	return request(
		`/api/vipnewcenter/app/level/task/reward/get`,
		data,
		createOption(query, "weapi"),
	);
});
