// 电台个性推荐
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/djradio/personalize/rcmd`,
		{
			limit: query.limit || 6,
		},
		createOption(query, "weapi"),
	);
});
