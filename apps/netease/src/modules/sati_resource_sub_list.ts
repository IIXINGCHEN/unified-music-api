// 助眠解压 - 收藏列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/voice/sati/resource/sub/list`,
		data,
		createOption(query),
	);
});
