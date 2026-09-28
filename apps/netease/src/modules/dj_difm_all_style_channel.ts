// DIFM电台 - 分类
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
		`/api/dj/difm/all/style/channel/v2`,
		data,
		createOption(query),
	);
});
