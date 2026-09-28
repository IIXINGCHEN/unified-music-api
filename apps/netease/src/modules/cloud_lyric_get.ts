// 获取云盘歌词
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		userId: query.uid,
		songId: query.sid,
		lv: -1,
		kv: -1,
	};
	return request(`/api/cloud/lyric/get`, data, createOption(query, "eapi"));
});
