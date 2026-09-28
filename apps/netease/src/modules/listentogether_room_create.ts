// 一起听创建房间
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		refer: "songplay_more",
	};
	return request(`/api/listen/together/room/create`, data, createOption(query));
});
