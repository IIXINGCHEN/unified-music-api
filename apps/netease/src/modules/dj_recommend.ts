// 精选电台
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(`/api/djradio/recommend/v1`, {}, createOption(query, "weapi"));
});
