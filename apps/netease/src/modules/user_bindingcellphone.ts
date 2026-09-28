import { createHash } from "node:crypto";
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		phone: query.phone,
		countrycode: query.countrycode || "86",
		captcha: query.captcha,
		password: query.password
			? createHash("md5").update(query.password, "utf8").digest("hex")
			: "",
	};
	return request(
		`/api/user/bindingCellphone`,
		data,
		createOption(query, "weapi"),
	);
});
