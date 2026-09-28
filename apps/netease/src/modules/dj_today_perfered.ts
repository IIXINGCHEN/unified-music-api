// 电台今日优选
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		page: query.page || 0,
	};
	return request(
		`/api/djradio/home/today/perfered`,
		data,
		createOption(query, "weapi"),
	);
});
