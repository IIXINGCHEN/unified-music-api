// 喜欢的歌曲(无序)
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		uid: query.uid,
	};
	return request(`/api/song/like/get`, data, createOption(query));
});
