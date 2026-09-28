// 获取所有关注歌手最近的 50 首新歌
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/sub/artist/new/works/song/playall`,
		{},
		createOption(query, "eapi"),
	);
});
