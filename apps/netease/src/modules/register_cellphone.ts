// 注册账号
import { createHash } from "node:crypto";
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		captcha: query.captcha,
		phone: query.phone,
		password: createHash("md5").update(query.password, "utf8").digest("hex"),
		nickname: query.nickname,
		countrycode: query.countrycode || "86",
		force: "false",
	};
	return request(`/api/w/register/cellphone`, data, createOption(query));
});
