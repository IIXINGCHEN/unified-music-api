// 听歌排行
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		uid: query.uid,
		type: query.type || 0, // 1: 最近一周, 0: 所有时间
	};
	return request(`/api/v1/play/record`, data, createOption(query, "weapi"));
});
