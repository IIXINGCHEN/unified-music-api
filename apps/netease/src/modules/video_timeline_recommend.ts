// 推荐视频
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		offset: query.offset || 0,
		filterLives: "[]",
		withProgramInfo: "true",
		needUrl: "1",
		resolution: "480",
	};
	return request(`/api/videotimeline/get`, data, createOption(query, "weapi"));
});
