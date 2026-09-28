// 音乐人歌曲播放趋势
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		startTime: query.startTime,
		endTime: query.endTime,
	};
	return request(
		`/api/creator/musician/play/count/statistic/data/trend/get`,
		data,
		createOption(query, "weapi"),
	);
});
