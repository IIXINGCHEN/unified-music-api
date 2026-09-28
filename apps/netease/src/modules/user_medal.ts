// 用户徽章
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/medal/user/page`,
		{
			uid: query.uid,
		},
		createOption(query),
	);
});
