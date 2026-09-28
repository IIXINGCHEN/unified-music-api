// 黑胶乐签打卡详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		signDayTime: query.timestamp,
		type: "1",
	};
	return request(
		`/api/vipnewcenter/app/level/user/checkin/history/detail`,
		data,
		createOption(query, "eapi"),
	);
});
