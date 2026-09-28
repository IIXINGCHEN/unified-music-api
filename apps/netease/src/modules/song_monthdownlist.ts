// 会员本月下载歌曲记录
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
	return request(`/api/member/song/monthdownlist`, data, createOption(query));
});
