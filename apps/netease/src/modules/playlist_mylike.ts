import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		time: query.time || "-1",
		limit: query.limit || "12",
	};
	return request(
		`/api/mlog/playlist/mylike/bytime/get`,
		data,
		createOption(query, "weapi"),
	);
});
