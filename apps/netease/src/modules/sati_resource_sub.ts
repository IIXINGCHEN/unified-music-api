// 助眠解压 - 收藏
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		cancel: query.cancel || false,
	};
	return request(`/api/voice/sati/resource/sub`, data, createOption(query));
});
