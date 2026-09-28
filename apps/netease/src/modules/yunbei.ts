import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	// /api/point/today/get
	return request(`/api/point/signed/get`, data, createOption(query, "weapi"));
});
