// 歌词摘录 - 歌词摘录信息
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		songId: query.id,
	};
	return request(`/api/song/play/lyrics/mark/song`, data, createOption(query));
});
