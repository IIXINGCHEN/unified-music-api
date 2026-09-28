import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 100,
	};
	return request(
		`/api/play-record/newvideo/list`,
		data,
		createOption(query, "weapi"),
	);
});
