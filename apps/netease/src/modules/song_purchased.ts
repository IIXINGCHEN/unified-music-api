// 已购单曲
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 20,
		offset: query.offset || 0,
	};
	return request(
		`/api/single/mybought/song/list`,
		data,
		createOption(query, "weapi"),
	);
});
