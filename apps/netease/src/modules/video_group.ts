// 视频标签/分类下的视频
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		groupId: query.id,
		offset: query.offset || 0,
		need_preview_url: "true",
		total: true,
	};
	return request(
		`/api/videotimeline/videogroup/otherclient/get`,
		data,
		createOption(query, "weapi"),
	);
});
