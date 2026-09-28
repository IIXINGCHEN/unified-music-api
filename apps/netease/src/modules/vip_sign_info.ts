// 黑胶乐签未来签到信息
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/vipnewcenter/app/user/sign/info`,
		data,
		createOption(query, "weapi"),
	);
});
