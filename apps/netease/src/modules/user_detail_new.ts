// 用户详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		all: "true",
		userId: query.uid,
	};
	const res = await request(
		`/api/w/v1/user/detail/${query.uid}`,
		data,
		createOption(query, "eapi"),
	);
	// const result = JSON.stringify(res).replace(
	//   /avatarImgId_str/g,
	//   "avatarImgIdStr"
	// );
	// return JSON.parse(result);
	return res;
});
