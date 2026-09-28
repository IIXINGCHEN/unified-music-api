// 一起听 结束房间
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
	return request(`/api/listen/together/end/v2`, data, createOption(query));
});
