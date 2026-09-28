// 听歌足迹 - 本周/本月收听时长
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/content/activity/listen/data/realtime/report`,
		{
			type: query.type || "week", //周 week 月 month
		},
		createOption(query),
	);
});
