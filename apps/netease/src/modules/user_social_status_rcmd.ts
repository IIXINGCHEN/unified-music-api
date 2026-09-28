// 用户状态 - 相同状态的用户
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(`/api/social/user/status/rcmd`, {}, createOption(query));
});
