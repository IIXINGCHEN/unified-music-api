import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 20,
		startTimestamp: query.before || Date.now(),
	};
	return request(
		`/api/sub/artist/new/works/song/list`,
		data,
		createOption(query, "weapi"),
	);
});
