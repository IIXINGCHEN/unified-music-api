// 歌词摘录 - 删除摘录歌词
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		markIds: query.id,
	};
	return request(`/api/song/play/lyrics/mark/del`, data, createOption(query));
});
