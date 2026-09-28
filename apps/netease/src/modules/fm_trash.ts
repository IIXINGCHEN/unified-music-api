// 垃圾桶
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		songId: query.id,
		alg: "RT",
		time: query.time || 25,
	};
	return request(`/api/radio/trash/add`, data, createOption(query, "weapi"));
});
