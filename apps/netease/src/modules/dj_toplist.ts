// 新晋电台榜/热门电台榜
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

const typeMap: Record<string, number> = {
	new: 0,
	hot: 1,
};

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 100,
		offset: query.offset || 0,
		type: typeMap[query.type || "new"] || "0", //0为新晋,1为热门
	};
	return request(`/api/djradio/toplist`, data, createOption(query, "weapi"));
});
