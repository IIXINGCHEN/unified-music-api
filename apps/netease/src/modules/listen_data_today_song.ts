// 听歌足迹 - 今日收听
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/content/activity/listen/data/today/song/play/rank`,
		{},
		createOption(query),
	);
});
