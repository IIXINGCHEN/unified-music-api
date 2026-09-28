// 获取音乐人任务
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/nmusician/workbench/special/right/vip/info`,
		data,
		createOption(query, "eapi"),
	);
});
