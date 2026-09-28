/**
 * Port of api-enhanced/util/option.js — builds createRequest options from a
 * module query object. Logic copied verbatim.
 */
import type { NcmQuery } from "./module.js";
import type { NcmRequestOptions } from "./request.js";

export const createOption = (
	query: NcmQuery,
	crypto = "",
	checkToken: string | boolean = false,
): NcmRequestOptions => {
	return {
		crypto: query.crypto || crypto || "",
		cookie: query.cookie || process.env.NETEASE_COOKIE,
		ua: query.ua || "",
		proxy: query.proxy,
		realIP: query.realIP,
		randomCNIP:
			process.env.ENABLE_RANDOM_CN_IP === "true"
				? ![false, "false"].includes(query.randomCNIP)
				: [true, "true"].includes(query.randomCNIP),
		e_r: query.e_r || undefined,
		domain: query.domain || "",
		checkToken: query.checkToken || checkToken,
		headers: query.headers || {},
		timeout: query.timeout || 0,
	};
};
