// 每日推荐歌单
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/v1/discovery/recommend/resource`,
		{},
		createOption(query, "weapi"),
	);
});
