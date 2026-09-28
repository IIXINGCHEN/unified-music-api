// 相似歌手
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		artistid: query.id,
	};
	return request(
		`/api/discovery/simiArtist`,
		data,
		createOption(query, "weapi"),
	);
});
