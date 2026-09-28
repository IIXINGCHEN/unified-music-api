// 电台非热门类型
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/djradio/category/excludehot`,
		{},
		createOption(query, "weapi"),
	);
});
