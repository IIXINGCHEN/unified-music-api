// 歌手相关视频
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		artistId: query.id,
		page: JSON.stringify({
			size: query.size || 10,
			cursor: query.cursor || 0,
		}),
		tab: 0,
		order: query.order || 0,
	};
	return request(`/api/mlog/artist/video`, data, createOption(query, "weapi"));
});
