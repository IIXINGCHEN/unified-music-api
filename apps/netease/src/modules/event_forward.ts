// 转发动态
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		forwards: query.forwards,
		id: query.evId,
		eventUserId: query.uid,
	};
	return request(`/api/event/forward`, data, createOption(query));
});
