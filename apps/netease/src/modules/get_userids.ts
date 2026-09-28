import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		nicknames: query.nicknames,
	};
	return request(`/api/user/getUserIds`, data, createOption(query, "weapi"));
});
