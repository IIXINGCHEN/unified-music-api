import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
import uploadPlugin from "../plugins/upload.js";
export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	const uploadInfo = await uploadPlugin(query, request);
	const res = await request(
		`/api/user/avatar/upload/v1`,
		{
			imgid: uploadInfo.imgId,
		},
		createOption(query),
	);
	return {
		status: 200,
		body: {
			code: 200,
			data: {
				...uploadInfo,
				...res.body,
			},
		},
	};
});
