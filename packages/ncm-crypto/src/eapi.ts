/**
 * eapi encryption/decryption + the legacy decrypt() debug helper.
 *
 * Port of the eapi section of util/crypto.js:
 *   - CryptoJS.MD5(message).toString()            -> node:crypto md5 hex digest
 *   - CryptoJS.AES round-trips                    -> aesEncrypt/aesDecrypt
 *   - decrypt() passes eapiKey as a *string* to CryptoJS, which runs it
 *     through EvpKDF(MD5) with a RANDOM 8-byte salt on every call. That
 *     mechanism is replicated below (evpKdfMd5 + randomBytes(8)); the
 *     function is therefore nondeterministic in the original too (usually
 *     returns '', sometimes throws 'Malformed UTF-8 data'), and it has no
 *     callers in the codebase (debug helper only).
 */
import crypto from "node:crypto";
import { gunzipSync } from "node:zlib";
import { eapiKey } from "./constants.js";
import { aesDecrypt, aesEncrypt } from "./weapi.js";

/** eapi request encryption: AES-128-ECB of the url/text/digest envelope. */
export const eapi = (url: string, object: unknown): { params: string } => {
	const text =
		typeof object === "object" ? JSON.stringify(object) : String(object);
	const message = `nobody${url}use${text}md5forencrypt`;
	const digest = crypto.createHash("md5").update(message, "utf8").digest("hex");
	const data = `${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}`;
	return {
		params: aesEncrypt(data, "ecb", eapiKey, "", "hex"),
	};
};

/** eapi response decryption (aeapi=true: base64 -> gzip -> JSON). */
export const eapiResDecrypt = (
	encryptedParams: string,
	aeapi = false,
): unknown => {
	try {
		const decrypted = aesDecrypt(encryptedParams, "ecb", eapiKey, "", "hex");
		if (aeapi) {
			const decompressed = gunzipSync(
				Buffer.from(decrypted.toString("base64"), "base64"),
			);
			return JSON.parse(decompressed.toString());
		}
		return JSON.parse(decrypted.toString("utf8"));
	} catch (error) {
		console.log("eapiResDecrypt error:", error);
		return null;
	}
};

/** eapi request decryption: split the url/text/digest envelope. */
export const eapiReqDecrypt = (
	encryptedParams: string,
): { url: string; data: unknown } | null => {
	const decryptedData = aesDecrypt(
		encryptedParams,
		"ecb",
		eapiKey,
		"",
		"hex",
	).toString("utf8");
	const match = decryptedData.match(/(.*?)-36cd479b6b5-(.*?)-36cd479b6b5-(.*)/);
	if (match) {
		return { url: match[1], data: JSON.parse(match[2]) };
	}
	return null;
};

/**
 * CryptoJS EvpKDF with MD5, 1 iteration:
 * block_i = MD5(block_{i-1} + password + salt), concatenated until
 * keyBytes + ivBytes are available.
 */
const evpKdfMd5 = (
	password: Buffer,
	salt: Buffer,
	keyBytes: number,
	ivBytes: number,
): Buffer => {
	let derived = Buffer.alloc(0);
	let block = Buffer.alloc(0);
	while (derived.length < keyBytes + ivBytes) {
		const h = crypto.createHash("md5");
		if (block.length > 0) h.update(block);
		h.update(password);
		h.update(salt);
		block = h.digest();
		derived = Buffer.concat([derived, block]);
	}
	return derived.subarray(0, keyBytes + ivBytes);
};

/** CryptoJS.enc.Utf8.stringify semantics: valid UTF-8 -> string, else throw. */
const strictUtf8ToString = (buf: Buffer): string => {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(buf);
	} catch {
		throw new Error("Malformed UTF-8 data");
	}
};

/**
 * Legacy decrypt helper. Mechanism-preserving port (see header comment):
 * random-salt EvpKDF -> AES-128-ECB decrypt -> strict UTF-8 decode.
 * Nondeterministic by design (same as the original).
 *
 * Padding quirk preserved: CryptoJS's Pkcs7.unpad does NOT validate padding,
 * it blindly truncates by the last byte's value, so auto-padding is disabled
 * here and the same blind truncation is applied manually.
 */
export const decrypt = (cipher: string): string => {
	const salt = crypto.randomBytes(8);
	const key = evpKdfMd5(Buffer.from(eapiKey, "utf8"), salt, 16, 16).subarray(
		0,
		16,
	);
	const decipher = crypto.createDecipheriv("aes-128-ecb", key, null);
	decipher.setAutoPadding(false);
	const raw = Buffer.concat([
		decipher.update(Buffer.from(cipher, "hex")),
		decipher.final(),
	]);
	const nPad = raw[raw.length - 1];
	const plaintext = raw.subarray(0, raw.length - nPad);
	return strictUtf8ToString(plaintext);
};
