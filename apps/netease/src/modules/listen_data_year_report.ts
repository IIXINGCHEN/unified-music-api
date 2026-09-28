// 听歌足迹 - 年度听歌足迹
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/content/activity/listen/data/year/report`,
		{},
		createOption(query),
	);
});
