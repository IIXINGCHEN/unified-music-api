import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		key: query.key,
		type: 3,
	};
	let result: Awaited<ReturnType<NcmRequestFn>> | undefined;
	try {
		result = await request(
			`/api/login/qrcode/client/login`,
			data,
			createOption(query),
		);
		result = {
			status: 200,
			body: {
				...result.body,
				cookie: result.cookie.join(";"),
			},
			cookie: result.cookie,
		};
		return result;
	} catch {
		return {
			status: 200,
			body: {},
			// 原实现 catch 中引用 try 块级作用域的 result 必抛 ReferenceError；
			// 此处改为返回空 cookie，避免错误路径二次崩溃
			cookie: result?.cookie ?? [],
		};
	}
});
