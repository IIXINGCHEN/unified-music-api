// 我的数字专辑
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
		total: true,
	};
	return request(
		`/api/digitalAlbum/purchased`,
		data,
		createOption(query, "weapi"),
	);
});
