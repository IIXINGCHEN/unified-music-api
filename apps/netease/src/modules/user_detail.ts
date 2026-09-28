// 用户详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	const res = await request(
		`/api/v1/user/detail/${query.uid}`,
		{},
		createOption(query, "weapi"),
	);
	const result = JSON.stringify(res).replace(
		/avatarImgId_str/g,
		"avatarImgIdStr",
	);
	return JSON.parse(result);
});
