// 歌手专辑列表
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
		`/api/artist/albums/${query.id}`,
		data,
		createOption(query, "weapi"),
	);
});
