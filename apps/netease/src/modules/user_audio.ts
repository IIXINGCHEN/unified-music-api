// 用户创建的电台
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		userId: query.uid,
	};
	return request(`/api/djradio/get/byuser`, data, createOption(query, "weapi"));
});
