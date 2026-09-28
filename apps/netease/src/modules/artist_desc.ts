// 歌手介绍
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
	};
	return request(
		`/api/artist/introduction`,
		data,
		createOption(query, "weapi"),
	);
});
