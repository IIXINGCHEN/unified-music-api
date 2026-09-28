// 所有榜单内容摘要v2
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(`/api/toplist/detail/v2`, {}, createOption(query, "weapi"));
});
