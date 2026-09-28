// 将mlog id转为video id
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		mlogId: query.id,
	};
	return request(
		`/api/mlog/video/convert/id`,
		data,
		createOption(query, "weapi"),
	);
});
