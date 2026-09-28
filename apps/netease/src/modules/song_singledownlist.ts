// 已购买单曲
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || "20",
		offset: query.offset || "0",
		total: "true",
	};
	return request(`/api/member/song/singledownlist`, data, createOption(query));
});
