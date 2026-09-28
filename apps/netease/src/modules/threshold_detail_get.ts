// 获取达人达标信息
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {};
	return request(
		`/api/influencer/web/apply/threshold/detail/get`,
		data,
		createOption(query),
	);
});
