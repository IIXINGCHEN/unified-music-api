// 相关视频
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		id: query.id,
		type: /^\d+$/.test(query.id) ? 0 : 1,
	};
	return request(
		`/api/cloudvideo/v1/allvideo/rcmd`,
		data,
		createOption(query, "weapi"),
	);
});
