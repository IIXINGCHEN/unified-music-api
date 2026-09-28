// 曲风偏好
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/tag/my/preference/get`,
		data,
		createOption(query, "weapi"),
	);
});
