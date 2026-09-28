// DIFM电台 - 取消收藏频道
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
	};
	return request(`/api/dj/difm/channel/unsubscribe`, data, createOption(query));
});
