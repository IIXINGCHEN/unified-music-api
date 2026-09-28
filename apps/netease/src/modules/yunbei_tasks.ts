import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/usertool/task/list/all`,
		data,
		createOption(query, "weapi"),
	);
});
