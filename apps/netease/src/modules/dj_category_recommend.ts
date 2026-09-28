// 电台推荐类型
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/djradio/home/category/recommend`,
		{},
		createOption(query, "weapi"),
	);
});
