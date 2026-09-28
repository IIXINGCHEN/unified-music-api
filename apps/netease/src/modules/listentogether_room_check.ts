// 一起听 房间情况
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		roomId: query.roomId,
	};
	return request(`/api/listen/together/room/check`, data, createOption(query));
});
