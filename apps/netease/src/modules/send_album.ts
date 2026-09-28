// 私信专辑
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
		type: "album",
		userIds: `[${query.user_ids}]`,
	};
	return request(`/api/msg/private/send`, data, createOption(query));
});
