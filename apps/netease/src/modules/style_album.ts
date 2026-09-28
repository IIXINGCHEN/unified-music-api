// 曲风-专辑
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		cursor: query.cursor || 0,
		size: query.size || 20,
		tagId: query.tagId,
		sort: query.sort || 0,
	};
	return request(
		`/api/style-tag/home/album`,
		data,
		createOption(query, "weapi"),
	);
});
