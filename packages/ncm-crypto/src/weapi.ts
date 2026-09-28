/**
 * weapi encryption + low-level AES/RSA primitives.
 *
 * Port of the weapi section of util/crypto.js:
 *   - CryptoJS AES  -> node:crypto createCipheriv/createDecipheriv
 *                     (AES-128-CBC/ECB, PKCS7 padding, Utf8 key/iv parsing)
 *   - node-forge raw RSA ('NONE' padding) -> BigInt modular exponentiation
 *                     (m^e mod n, output left-padded with zeros to modulus
 *                     length; verified byte-identical against node-forge)
 */
import crypto from "node:crypto";
import { base62, iv, presetKey, publicKey } from "./constants.js";

export type AesMode = "cbc" | "ecb";

/**
 * AES-128 encrypt. Mirrors CryptoJS.AES.encrypt(Utf8.parse(text),
 * Utf8.parse(key), { iv: Utf8.parse(iv), mode, padding: Pkcs7 }).
 * format 'base64' (default) or 'hex' (UPPERCASE hex, like CryptoJS).
 */
export const aesEncrypt = (
	text: string,
	mode: string,
	key: string,
	ivText: string,
	format = "base64",
): string => {
	const m = mode.toLowerCase();
	const cipher = crypto.createCipheriv(
		`aes-128-${m}`,
		Buffer.from(key, "utf8"),
		m === "cbc" ? Buffer.from(ivText, "utf8") : null,
	);
	const encrypted = Buffer.concat([
		cipher.update(Buffer.from(text, "utf8")),
		cipher.final(),
	]);
	return format === "base64"
		? encrypted.toString("base64")
		: encrypted.toString("hex").toUpperCase();
};

/**
 * AES-128 decrypt. The original returns a CryptoJS WordArray; callers convert
 * with .toString(CryptoJS.enc.Utf8/.Base64) - here a Buffer is returned, so
 * callers use .toString('utf8') / .toString('base64') instead.
 */
export const aesDecrypt = (
	ciphertext: string,
	mode: string,
	key: string,
	ivText: string,
	format = "base64",
): Buffer => {
	const m = mode.toLowerCase();
	const data =
		format === "base64"
			? Buffer.from(ciphertext, "base64")
			: Buffer.from(ciphertext, "hex");
	const decipher = crypto.createDecipheriv(
		`aes-128-${m}`,
		Buffer.from(key, "utf8"),
		m === "cbc" ? Buffer.from(ivText, "utf8") : null,
	);
	return Buffer.concat([decipher.update(data), decipher.final()]);
};

const b64urlToBigInt = (s: string): bigint =>
	BigInt(
		"0x" +
			Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
				"hex",
			),
	);

const modPow = (base: bigint, exp: bigint, mod: bigint): bigint => {
	let result = 1n;
	let b = base % mod;
	let e = exp;
	while (e > 0n) {
		if (e & 1n) result = (result * b) % mod;
		b = (b * b) % mod;
		e >>= 1n;
	}
	return result;
};

/**
 * Raw RSA encryption (node-forge 'NONE' padding semantics):
 * c = m^e mod n over the message bytes as a big-endian integer, result
 * rendered as hex left-padded with '0' to the full modulus length.
 */
export const rsaEncrypt = (str: string, key: string): string => {
	const keyObj = crypto.createPublicKey(key);
	const jwk = keyObj.export({ format: "jwk" });
	if (typeof jwk.n !== "string" || typeof jwk.e !== "string") {
		throw new Error("rsaEncrypt: public key JWK is missing n/e");
	}
	const n = b64urlToBigInt(jwk.n);
	const e = b64urlToBigInt(jwk.e);
	const m = BigInt("0x" + Buffer.from(str, "utf8").toString("hex"));
	const modulusBytes = (keyObj.asymmetricKeyDetails?.modulusLength ?? 1024) / 8;
	return modPow(m, e, n)
		.toString(16)
		.padStart(modulusBytes * 2, "0");
};

/** weapi request encryption: double AES-CBC + RSA-encrypted secret key. */
export const weapi = (
	object: Record<string, unknown>,
): { params: string; encSecKey: string } => {
	const text = JSON.stringify(object);
	let secretKey = "";
	for (let i = 0; i < 16; i++) {
		secretKey += base62.charAt(Math.round(Math.random() * 61));
	}
	return {
		params: aesEncrypt(
			aesEncrypt(text, "cbc", presetKey, iv),
			"cbc",
			secretKey,
			iv,
		),
		encSecKey: rsaEncrypt(secretKey.split("").reverse().join(""), publicKey),
	};
};
