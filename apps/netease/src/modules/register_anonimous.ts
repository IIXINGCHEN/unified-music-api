// 获取游客cookie

import { createHash } from "node:crypto";
import {
	createOption,
	defineModule,
	generateDeviceId,
	type NcmQuery,
	type NcmRequestFn,
	setDeviceId,
} from "@music-api/ncm-core";
import { logger } from "../logger.js";

const ID_XOR_KEY_1 = "3go8&$8*3*3h0k(2)2";

// function getRandomFromList(list) {
//   return list[Math.floor(Math.random() * list.length)]
// }
function cloudmusic_dll_encode_id(some_id: string): string {
	let xoredString = "";
	for (let i = 0; i < some_id.length; i++) {
		const charCode =
			some_id.charCodeAt(i) ^ ID_XOR_KEY_1.charCodeAt(i % ID_XOR_KEY_1.length);
		xoredString += String.fromCharCode(charCode);
	}
	// CryptoJS.enc.Utf8.parse(xoredString) -> MD5 -> Base64
	return createHash("md5").update(xoredString, "utf8").digest("base64");
}

export default defineModule(async (query: NcmQuery, request: NcmRequestFn) => {
	const deviceId = generateDeviceId();
	logger.info(`Successfully registered anonimous token, deviceId: ${deviceId}`);
	setDeviceId(deviceId);
	const encodedId = Buffer.from(
		`${deviceId} ${cloudmusic_dll_encode_id(deviceId)}`,
		"utf8",
	).toString("base64");
	const data = {
		username: encodedId,
	};
	let result = await request(
		`/api/register/anonimous`,
		data,
		createOption(query, "xeapi"),
	);
	if (result.body.code === 200) {
		result = {
			status: 200,
			body: {
				...result.body,
				cookie: result.cookie,
			},
			cookie: result.cookie,
		};
	}
	return result;
});
