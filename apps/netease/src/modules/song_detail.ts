// 歌曲详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// 歌曲数量不要超过1000
	query.ids = query.ids.split(/\s*,\s*/);
	const data = {
		c: `[${(query.ids as string[]).map((id) => `{"id":${id}}`).join(",")}]`,
	};
	return request(`/api/v3/song/detail`, data, createOption(query, "weapi"));
});
