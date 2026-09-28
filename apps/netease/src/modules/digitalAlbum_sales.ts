// 数字专辑销量
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		albumIds: query.ids,
	};
	return request(
		`/api/vipmall/albumproduct/album/query/sales`,
		data,
		createOption(query, "weapi"),
	);
});
