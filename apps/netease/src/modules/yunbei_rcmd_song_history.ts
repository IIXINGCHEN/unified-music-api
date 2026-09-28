// 云贝推歌历史记录
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		page: JSON.stringify({
			size: query.size || 20,
			cursor: query.cursor || "",
		}),
	};
	return request(
		`/api/yunbei/rcmd/song/history/list`,
		data,
		createOption(query, "weapi"),
	);
});
