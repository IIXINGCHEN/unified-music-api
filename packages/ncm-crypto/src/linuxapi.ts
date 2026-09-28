/**
 * linuxapi encryption.
 *
 * Port of the linuxapi section of util/crypto.js:
 * CryptoJS AES-ECB with the raw key bytes, output as UPPERCASE hex.
 */

import { linuxapiKey } from "./constants.js";
import { aesEncrypt } from "./weapi.js";

export const linuxapi = (
	object: Record<string, unknown>,
): { eparams: string } => {
	const text = JSON.stringify(object);
	return {
		eparams: aesEncrypt(text, "ecb", linuxapiKey, "", "hex"),
	};
};
