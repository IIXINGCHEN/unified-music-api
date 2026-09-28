// 歌手粉丝数量
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
		`/api/artist/follow/count/get`,
		data,
		createOption(query, "weapi"),
	);
});
