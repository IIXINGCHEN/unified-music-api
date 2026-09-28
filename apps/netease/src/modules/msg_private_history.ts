// 私信内容
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		userId: query.uid,
		limit: query.limit || 30,
		time: query.before || 0,
		total: "true",
	};
	return request(
		`/api/msg/private/history`,
		data,
		createOption(query, "weapi"),
	);
});
