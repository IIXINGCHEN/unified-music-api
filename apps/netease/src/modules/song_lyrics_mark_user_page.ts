// 歌词摘录 - 我的歌词本
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 10,
		offset: query.offset || 0,
	};
	return request(
		`/api/song/play/lyrics/mark/user/page`,
		data,
		createOption(query),
	);
});
