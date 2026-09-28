// 视频详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
	};
	return request(
		`/api/cloudvideo/v1/video/detail`,
		data,
		createOption(query, "weapi"),
	);
});
