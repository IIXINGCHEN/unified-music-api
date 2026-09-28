// 获取免费听时长状态
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		entrance: "FREE_LISTEN_RN",
	};
	return request(
		`/api/ad/homepage/free/tab/extend/v2`,
		data,
		createOption(query, "xeapi"),
	);
});
