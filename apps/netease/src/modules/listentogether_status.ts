// 一起听状态
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/listen/together/status/get`,
		{},
		createOption(query, "weapi"),
	);
});
