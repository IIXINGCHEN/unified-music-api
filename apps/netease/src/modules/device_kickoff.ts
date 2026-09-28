// 强制下线设备
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		key: query.deviceKey,
		captcha: query.captcha || "",
	};
	return request(
		`/api/middle/user/security/device/kickoff`,
		data,
		createOption(query, "eapi"),
	);
});
