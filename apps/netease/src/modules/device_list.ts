// 登录设备列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		excStatus: "9",
	};
	return request(
		`/api/middle/user/device/list`,
		data,
		createOption(query, "eapi"),
	);
});
