// @music-api/kugou-crypto — crypto.ts
// 手写移植自 KuGouMusicApi/util/crypto.js（318 行）。
// 原则：算法照搬；MD5/SHA1/AES/RSA 全部走 node:crypto，逐字节对齐 crypto-js / node-forge 语义。
// 关键语义点（均有 golden-vector 锁定）：
//  - cryptoMd5: typeof data === 'object' 时先 JSON.stringify（含 Buffer -> {"type":"Buffer",...}）
//  - AES: key 按 UTF-8 字节长度选 aes-128/192/256-cbc（原 CryptoJS 按 WordArray 字节数选档）；
//    派生模式 key = md5(tempKey).substring(0,32) 即 32 字节 -> AES-256-CBC
//  - cryptoAesEncrypt 返回形态：opt.key 非空 -> 纯 hex；否则 { str, key }（原 `opt?.key && opt?.key` 判据照搬）
//  - cryptoRSAEncrypt: 裸 RSA（m^e mod n，无填充），buffer 左对齐、右侧零填充到 keyLength
//  - rsaEncrypt2: RSAES-PKCS1-V1_5（node:crypto publicEncrypt 默认即此填充）

import {
	constants,
	createCipheriv,
	createDecipheriv,
	createHash,
	createPublicKey,
	publicEncrypt,
} from "node:crypto";
import { randomString } from "./codec.js";

export const publicRasKey = `-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDIAG7QOELSYoIJvTFJhMpe1s/gbjDJX51HBNnEl5HXqTW6lQ7LC8jr9fWZTwusknp+sVGzwd40MwP6U5yDE27M/X1+UR4tvOGOqp94TJtQ1EPnWGWXngpeIW5GxoQGao1rmYWAu6oi1z9XkChrsUdC6DJE5E221wf/4WLFxwAtRQIDAQAB\n-----END PUBLIC KEY-----`;
export const publicLiteRasKey = `-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDECi0Np2UR87scwrvTr72L6oO01rBbbBPriSDFPxr3Z5syug0O24QyQO8bg27+0+4kBzTBTBOZ/WWU0WryL1JSXRTXLgFVxtzIY41Pe7lPOgsfTCn5kZcvKhYKJesKnnJDNr5/abvTGf+rHG3YRwsCHcQ08/q6ifSioBszvb3QiwIDAQAB\n-----END PUBLIC KEY-----`;

/** 原 normalizeBuffer：string -> UTF-8 字节；其余（object 含 Buffer/Uint8Array）-> JSON.stringify 再 UTF-8 */
function normalizeBytes(data: unknown): Buffer {
	const str = typeof data === "string" ? data : JSON.stringify(data);
	return Buffer.from(str, "utf8");
}

function aesAlgorithm(keyBytes: Buffer): string {
	switch (keyBytes.length) {
		case 16:
			return "aes-128-cbc";
		case 24:
			return "aes-192-cbc";
		case 32:
			return "aes-256-cbc";
		default:
			throw new Error(`unsupported AES key length: ${keyBytes.length}`);
	}
}

/** MD5，hex 小写输出 */
export function cryptoMd5(data: unknown): string {
	const str = typeof data === "string" ? data : JSON.stringify(data);
	return createHash("md5").update(str, "utf8").digest("hex");
}

/** SHA1，hex 小写输出 */
export function cryptoSha1(data: unknown): string {
	const str = typeof data === "string" ? data : JSON.stringify(data);
	return createHash("sha1").update(str, "utf8").digest("hex");
}

export interface AesEncryptOptions {
	key?: string;
	iv?: string;
}

/**
 * AES-CBC/Pkcs7 加密。
 * - opt.key && opt.iv：直接使用（UTF-8 字节）
 * - 否则：tempKey = opt.key || 随机16位小写；key = md5(tempKey)[0:32]；iv = key 末 16 位
 * - 返回：opt.key 非空 -> hex 字符串；否则 { str: hex, key: tempKey }
 */
export function cryptoAesEncrypt(
	data: unknown,
	opt?: AesEncryptOptions,
): string | { str: string; key: string } {
	const buffer = normalizeBytes(data);
	let keyStr: string;
	let ivStr: string;
	let tempKey = "";

	if (opt?.key && opt?.iv) {
		keyStr = opt.key;
		ivStr = opt.iv;
	} else {
		tempKey = opt?.key || randomString(16).toLowerCase();
		keyStr = cryptoMd5(tempKey).substring(0, 32);
		ivStr = keyStr.substring(keyStr.length - 16);
	}

	const keyBytes = Buffer.from(keyStr, "utf8");
	const cipher = createCipheriv(
		aesAlgorithm(keyBytes),
		keyBytes,
		Buffer.from(ivStr, "utf8"),
	);
	const hex = Buffer.concat([cipher.update(buffer), cipher.final()]).toString(
		"hex",
	);

	if (opt?.key) return hex;
	return { str: hex, key: tempKey };
}

/**
 * AES-CBC/Pkcs7 解密。
 * - iv 缺省：key = md5(key)[0:32]，iv = key 末 16 位
 * - 成功解析 JSON 时返回对象，否则返回原文字符串
 */
export function cryptoAesDecrypt(
	data: string,
	key: string,
	iv?: string,
): string | Record<string, string> {
	let keyStr = key;
	if (!iv) keyStr = cryptoMd5(key).substring(0, 32);
	const ivStr = iv || keyStr.substring(keyStr.length - 16);

	const keyBytes = Buffer.from(keyStr, "utf8");
	const decipher = createDecipheriv(
		aesAlgorithm(keyBytes),
		keyBytes,
		Buffer.from(ivStr, "utf8"),
	);
	const text = Buffer.concat([
		decipher.update(Buffer.from(data, "hex")),
		decipher.final(),
	]).toString("utf8");
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

// ---------- RSA ----------

interface RsaPublic {
	n: bigint;
	e: bigint;
	keyLength: number;
}

const rsaKeyCache = new Map<string, RsaPublic>();

function parseRsaPublic(pem: string): RsaPublic {
	const jwk = createPublicKey(pem).export({ format: "jwk" }) as unknown as {
		n: string;
		e: string;
	};
	const b64url = (s: string) =>
		Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
	const nBytes = b64url(jwk.n);
	const eBytes = b64url(jwk.e);
	return {
		n: BigInt(`0x${nBytes.toString("hex")}`),
		e: BigInt(`0x${eBytes.toString("hex")}`),
		keyLength: nBytes.length,
	};
}

function getRsaPublic(pem: string): RsaPublic {
	let k = rsaKeyCache.get(pem);
	if (!k) {
		k = parseRsaPublic(pem);
		rsaKeyCache.set(pem, k);
	}
	return k;
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
	let result = 1n;
	let b = base % mod;
	let x = exp;
	while (x > 0n) {
		if (x & 1n) result = (result * b) % mod;
		b = (b * b) % mod;
		x >>= 1n;
	}
	return result;
}

function isLite(): boolean {
	return process.env.platform === "lite";
}

/**
 * 裸 RSA 加密（m^e mod n，无填充；超长抛错，不足则右侧零填充到 keyLength）
 * 输出 hex，左补零到 keyLength*2
 */
export function cryptoRSAEncrypt(data: unknown, publicKey?: string): string {
	const buffer = normalizeBytes(data);
	const pem = publicKey || (isLite() ? publicLiteRasKey : publicRasKey);
	const key = getRsaPublic(pem);

	if (buffer.length > key.keyLength)
		throw new Error("Data length exceeds key size");
	const padded = Buffer.alloc(key.keyLength);
	buffer.copy(padded, 0);

	const m = BigInt(`0x${padded.toString("hex")}`);
	return modPow(m, key.e, key.n)
		.toString(16)
		.padStart(key.keyLength * 2, "0");
}

/** RSAES-PKCS1-V1_5 加密，输出 hex */
export function rsaEncrypt2(data: unknown): string {
	const buffer = normalizeBytes(data);
	const pem = isLite() ? publicLiteRasKey : publicRasKey;
	return publicEncrypt(
		{ key: pem, padding: constants.RSA_PKCS1_PADDING },
		buffer,
	).toString("hex");
}

// ---------- 歌单 AES（key/iv 由 6 位随机串的 MD5 派生，Base64 输出） ----------

export interface PlaylistCipher {
	key: string;
	str: string;
}

export function playlistAesEncrypt(data: unknown): PlaylistCipher {
	const useData =
		typeof data === "object" ? JSON.stringify(data) : String(data);
	const key = randomString(6).toLowerCase();
	const encryptKey = cryptoMd5(key).substring(0, 16);
	const iv = cryptoMd5(key).substring(16, 32);

	const cipher = createCipheriv(
		"aes-128-cbc",
		Buffer.from(encryptKey, "utf8"),
		Buffer.from(iv, "utf8"),
	);
	const str = Buffer.concat([
		cipher.update(Buffer.from(useData, "utf8")),
		cipher.final(),
	]).toString("base64");
	return { key, str };
}

export function playlistAesDecrypt(
	data: PlaylistCipher,
): string | Record<string, string> {
	const encryptKey = cryptoMd5(data.key).substring(0, 16);
	const iv = cryptoMd5(data.key).substring(16, 32);

	const decipher = createDecipheriv(
		"aes-128-cbc",
		Buffer.from(encryptKey, "utf8"),
		Buffer.from(iv, "utf8"),
	);
	const text = Buffer.concat([
		decipher.update(Buffer.from(data.str, "base64")),
		decipher.final(),
	]).toString("utf8");
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
