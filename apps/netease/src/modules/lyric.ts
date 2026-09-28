// 歌词
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		tv: -1,
		lv: -1,
		rv: -1,
		kv: -1,
		_nmclfl: 1,
	};
	return request(`/api/song/lyric`, data, createOption(query));
});
