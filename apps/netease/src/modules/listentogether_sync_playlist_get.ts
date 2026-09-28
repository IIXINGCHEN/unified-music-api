// 一起听 当前列表获取
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		roomId: query.roomId,
	};
	return request(
		`/api/listen/together/sync/playlist/get`,
		data,
		createOption(query),
	);
});
