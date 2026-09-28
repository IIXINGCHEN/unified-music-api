// 黑胶乐签打卡历史 / 状态查询
// 支持传入 type=0（用户信息栏）或 type=1（黑胶乐签）
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		type: query.type || "0",
	};
	return request(
		`/api/vipnewcenter/app/minidesk/music/sign/pc`,
		data,
		createOption(query, "eapi"),
	);
});
