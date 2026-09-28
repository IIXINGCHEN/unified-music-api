// 登录刷新
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	let result = await request(
		`/api/login/token/refresh`,
		{},
		createOption(query),
	);
	if (result.body.code === 200) {
		result = {
			status: 200,
			body: {
				...result.body,
				cookie: result.cookie.join(";"),
			},
			cookie: result.cookie,
		};
	}
	return result;
});
