// 私信歌曲
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		msg: query.msg || "",
		type: "song",
		userIds: `[${query.user_ids}]`,
	};
	return request(`/api/msg/private/send`, data, createOption(query));
});
