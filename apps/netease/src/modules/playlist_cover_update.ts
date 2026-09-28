import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
import uploadPlugin from "../plugins/upload.js";
export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	if (!query.imgFile) {
		return {
			status: 400,
			body: {
				code: 400,
				msg: "imgFile is required",
			},
		};
	}
	const uploadInfo = await uploadPlugin(query, request);
	const res = await request(
		`/api/playlist/cover/update`,
		{
			id: query.id,
			coverImgId: uploadInfo.imgId,
		},
		createOption(query, "weapi"),
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
