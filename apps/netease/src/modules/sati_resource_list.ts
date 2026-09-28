// 助眠解压 - 获取标签下资源列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		tag: query.tag,
		firstQuery: false,
	};

	return request(`/api/voice/sati/resource/list`, data, createOption(query));
});
