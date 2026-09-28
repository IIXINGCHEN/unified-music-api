// 编辑歌单
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	query.desc = query.desc || "";
	query.tags = query.tags || "";
	const data = {
		"/api/playlist/desc/update": `{"id":${query.id},"desc":"${query.desc}"}`,
		"/api/playlist/tags/update": `{"id":${query.id},"tags":"${query.tags}"}`,
		"/api/playlist/update/name": `{"id":${query.id},"name":"${query.name}"}`,
	};
	return request(`/api/batch`, data, createOption(query));
});
