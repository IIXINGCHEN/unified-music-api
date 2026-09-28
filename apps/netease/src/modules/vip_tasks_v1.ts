// 会员任务 - 新版
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		taskType: "app_vip_task_center",
		userId: query.id,
	};
	return request(
		`/api/middle/vip/mission/user/progress/list`,
		data,
		createOption(query, "xeapi"),
	);
});
