// 私信歌单
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.playlist,
		type: "playlist",
		msg: query.msg,
		userIds: `[${query.user_ids}]`,
	};
	return request(`/api/msg/private/send`, data, createOption(query));
});
