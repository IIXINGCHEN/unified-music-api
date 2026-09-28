// 音乐人数据概况
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/creator/musician/statistic/data/overview/get`,
		data,
		createOption(query, "weapi"),
	);
});
