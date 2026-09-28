// 付费电台
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 30,
		offset: query.offset || 0,
		_nmclfl: 1,
	};
	return request(
		`/api/djradio/home/paygift/list`,
		data,
		createOption(query, "weapi"),
	);
});
