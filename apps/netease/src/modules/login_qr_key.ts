import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		type: 3,
	};
	const result = await request(
		`/api/login/qrcode/unikey`,
		data,
		createOption(query),
	);
	return {
		status: 200,
		body: {
			data: result.body,
			code: 200,
		},
		cookie: result.cookie,
	};
});
