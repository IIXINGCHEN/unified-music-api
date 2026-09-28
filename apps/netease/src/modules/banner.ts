// 首页轮播图
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const clientTypeMap: Record<string, string> = {
		0: "pc",
		1: "android",
		2: "iphone",
		3: "ipad",
	};
	const type = clientTypeMap[query.type || 0] || "pc";
	return request(
		`/api/v2/banner/get`,
		{ clientType: type },
		createOption(query),
	);
});
