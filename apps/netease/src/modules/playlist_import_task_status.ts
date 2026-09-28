// 歌单导入 - 任务状态
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/playlist/import/task/status/v2`,
		{
			taskIds: JSON.stringify([query.id]),
		},
		createOption(query),
	);
});
