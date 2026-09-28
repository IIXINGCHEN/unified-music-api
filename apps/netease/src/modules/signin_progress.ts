// 签到进度
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		moduleId: query.moduleId || "1207signin-1207signin",
	};
	return request(
		`/api/act/modules/signin/v2/progress`,
		data,
		createOption(query, "weapi"),
	);
});
