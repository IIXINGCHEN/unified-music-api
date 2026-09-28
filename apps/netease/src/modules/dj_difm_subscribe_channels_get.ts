// DIFM电台 - 收藏列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		sources: query.sources || "[0]",
	};
	return request(
		`/api/dj/difm/subscribe/channels/get/v2`,
		data,
		createOption(query),
	);
});
