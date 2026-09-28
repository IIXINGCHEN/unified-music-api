// MV链接
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		r: query.r || 1080,
	};
	return request(
		`/api/song/enhance/play/mv/url`,
		data,
		createOption(query, "weapi"),
	);
});
