// 歌手单曲
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/v1/artist/${query.id}`,
		{},
		createOption(query, "weapi"),
	);
});
