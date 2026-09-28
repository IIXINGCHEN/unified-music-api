// 跑步漫游
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		bpm: query.bpm || 50,
	};
	return request(`/api/radio/sport/get`, data, createOption(query));
});
