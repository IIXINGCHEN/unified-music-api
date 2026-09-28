// 歌手分类
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

/* 
    type 取值
    1:男歌手
    2:女歌手
    3:乐队

    area 取值
    -1:全部
    7华语
    96欧美
    8:日本
    16韩国
    0:其他

    initial 取值 a-z/A-Z
*/

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		// biome-ignore lint/suspicious/noGlobalIsNan: original relies on global isNaN coercion for non-numeric strings
		initial: isNaN(query.initial)
			? (query.initial || "").toUpperCase().charCodeAt() || undefined
			: query.initial,
		offset: query.offset || 0,
		limit: query.limit || 30,
		total: true,
		type: query.type || "1",
		area: query.area,
	};
	return request(`/api/v1/artist/list`, data, createOption(query, "weapi"));
});
