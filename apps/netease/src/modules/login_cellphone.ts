// 手机登录

import { createHash } from "node:crypto";
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

const md5 = (s: string): string =>
	createHash("md5").update(s, "utf8").digest("hex");

export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		type: "1",
		https: "true",
		phone: query.phone,
		countrycode: query.countrycode || "86",
		captcha: query.captcha,
		[query.captcha ? "captcha" : "password"]: query.captcha
			? query.captcha
			: query.md5_password || md5(query.password),
		remember: "true",
		secureCaptcha: query.sca || "",
	};
	let result = await request(
		`/api/w/login/cellphone`,
		data,
		createOption(query, "weapi"),
	);

	if (result.body.code === 200) {
		result = {
			status: 200,
			body: {
				...JSON.parse(
					JSON.stringify(result.body).replace(
						/avatarImgId_str/g,
						"avatarImgIdStr",
					),
				),
				cookie: result.cookie,
			},
			cookie: result.cookie,
		};
	}
	return result;
});
