import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		nickname: query.nickname,
	};
	return request(
		`/api/nickname/duplicated`,
		data,
		createOption(query, "weapi"),
	);
});
