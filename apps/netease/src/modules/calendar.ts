import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		startTime: query.startTime || Date.now(),
		endTime: query.endTime || Date.now(),
	};
	return request(`/api/mcalendar/detail`, data, createOption(query, "weapi"));
});
