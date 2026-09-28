// 用户是否互相关注
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		friendid: query.uid,
	};
	return request(`/api/user/mutualfollow/get`, data, createOption(query));
});
