// 红心与取消红心歌曲
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	query.like = query.like !== "false";
	const data = {
		alg: "itembased",
		trackId: query.id,
		like: query.like,
		time: "3",
	};
	return request(`/api/radio/like`, data, createOption(query, "weapi"));
});
