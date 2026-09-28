// 用户贡献条目、积分、云贝数量
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(`/api/rep/ugc/user/devote`, data, createOption(query));
});
