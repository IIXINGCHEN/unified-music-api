// 我创建的播客声音
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		limit: query.limit || 20,
	};
	return request(
		`/api/social/my/created/voicelist/v1`,
		data,
		createOption(query, "weapi"),
	);
});
