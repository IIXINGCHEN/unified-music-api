// 听歌足迹 - 周/月/年收听报告
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/content/activity/listen/data/report`,
		{
			type: query.type || "week", //周 week 月 month 年 year
			endTime: query.endTime, // 不填就是本周/月的
		},
		createOption(query),
	);
});
