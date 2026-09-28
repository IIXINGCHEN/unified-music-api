// 一起听 发送心跳
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		roomId: query.roomId,
		songId: query.songId,
		playStatus: query.playStatus,
		progress: query.progress,
	};
	return request(`/api/listen/together/heartbeat`, data, createOption(query));
});
