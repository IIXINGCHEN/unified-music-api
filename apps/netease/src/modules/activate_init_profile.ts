// 初始化名字
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		nickname: query.nickname,
	};
	return request(`/api/activate/initProfile`, data, createOption(query));
});
