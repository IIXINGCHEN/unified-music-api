import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		actid: query.actid,
	};
	return request(`/api/act/event/hot`, data, createOption(query, "weapi"));
});
