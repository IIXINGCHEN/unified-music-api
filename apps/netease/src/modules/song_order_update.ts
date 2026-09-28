// 更新歌曲顺序
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		pid: query.pid,
		trackIds: query.ids,
		op: "update",
	};

	return request(`/api/playlist/manipulate/tracks`, data, createOption(query));
});
