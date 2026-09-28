// 全部视频列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		groupId: 0,
		offset: query.offset || 0,
		need_preview_url: "true",
		total: true,
	};
	//   /api/videotimeline/otherclient/get
	return request(
		`/api/videotimeline/otherclient/get`,
		data,
		createOption(query, "weapi"),
	);
});
