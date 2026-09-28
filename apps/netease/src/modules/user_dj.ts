// 用户电台节目
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 30,
		offset: query.offset || 0,
	};
	return request(
		`/api/dj/program/${query.uid}`,
		data,
		createOption(query, "weapi"),
	);
});
