// 曲风详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		tagId: query.tagId,
	};
	return request(
		`/api/style-tag/home/head`,
		data,
		createOption(query, "weapi"),
	);
});
