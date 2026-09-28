// 用户状态 - 编辑
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/social/user/status/edit`,
		{
			content: JSON.stringify({
				type: query.type,
				iconUrl: query.iconUrl,
				content: query.content,
				actionUrl: query.actionUrl,
			}),
		},
		createOption(query),
	);
});
