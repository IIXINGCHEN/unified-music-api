// 助眠解压 - 特定时间场景下的推荐资源
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		firstQuery: false,
	};
	return request(
		`/api/voice/sati/timescene/resources/get`,
		data,
		createOption(query),
	);
});
