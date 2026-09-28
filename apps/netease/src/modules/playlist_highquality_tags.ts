// 精品歌单 tags
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/playlist/highquality/tags`,
		data,
		createOption(query, "weapi"),
	);
});
