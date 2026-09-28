// 广播电台 - 全部电台
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		categoryId: query.categoryId || "0",
		regionId: query.regionId || "0",
		limit: query.limit || "20",
		lastId: query.lastId || "0",
		score: query.score || "-1",
	};
	return request(
		`/api/voice/broadcast/channel/list`,
		data,
		createOption(query),
	);
});
