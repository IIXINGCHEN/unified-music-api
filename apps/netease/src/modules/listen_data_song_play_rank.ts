// 听歌足迹 - 歌曲播放排行 (Top20)
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/content/activity/listen/data/song/play/rank`,
		{
			type: query.type || "month", //周 week 月 month
			endTime: query.endTime, // 不填就是本周/月的
		},
		createOption(query),
	);
});
