// 用户状态 - 支持设置的状态
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(`/api/social/user/status/support`, {}, createOption(query));
});
