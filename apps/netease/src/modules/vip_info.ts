// 获取 VIP 信息
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(
		`/api/music-vip-membership/front/vip/info`,
		{
			userId: query.uid || "",
		},
		createOption(query, "weapi"),
	);
});
