// 邮箱登录

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
		type: "0",
		https: "true",
		username: query.email,
		password: query.md5_password || md5(query.password),
		rememberLogin: "true",
	};
	let result = await request(`/api/w/login`, data, createOption(query));
	if (result.body.code === 502) {
		return {
			status: 200,
			body: {
				msg: "账号或密码错误",
				code: 502,
				message: "账号或密码错误",
			},
		};
	}
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
