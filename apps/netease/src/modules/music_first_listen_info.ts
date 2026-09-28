// 回忆坐标
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		songId: query.id,
	};
	return request(
		`/api/content/activity/music/first/listen/info`,
		data,
		createOption(query),
	);
});
