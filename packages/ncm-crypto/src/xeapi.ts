/**
 * xeapi encryption (X25519 + AES-ECB/GCM envelope).
 *
 * Verbatim port of the xeapi section of util/crypto.js (already node:crypto
 * based in the original; only JS -> TS necessities changed):
 *   - aesEcbEncrypt/aesEcbDecrypt keep the dynamic `aes-${key.length*8}-ecb`
 *     naming, including the original's implicit key-length contract
 *     (16/24/32 bytes only).
 *   - xeapiMidTransform: XOR with a random 16-byte pad, base64, rotate.
 *   - xeapiEncryptS: ephemeralRaw(32) + iv(12) + AES-128-GCM ct + tag(16);
 *     plaintext is `${b64(dynamicKey)}|${os}|${sk}` (pipe-joined, not JSON).
 *   - buildXeapiPlaintext always appends e_r=true to queryString.
 *   - xeapiSign uses the base64 *string* xeapiSignKey directly as the
 *     HMAC-SHA256 key (not decoded) - quirk preserved.
 *   - In xeapiResDecrypt the key passed is the eapiKey *string* (utf8 bytes).
 */
import crypto from "node:crypto";
import { gunzipSync } from "node:zlib";
import {
	eapiKey,
	x25519SpkiPrefix,
	xeapiSignKey,
	xeapiStaticKey,
} from "./constants.js";

export interface XeapiPublicKeyState {
	/** base64 of the raw 32-byte X25519 server public key */
	publicKey: string;
	sk?: string;
	version: string;
}

export interface XeapiOptions {
	publicKeyState?: XeapiPublicKeyState;
	sessionKey?: string;
	sessionId?: string;
	os?: string;
	method?: string;
	contentType?: string;
}

const aesEcbEncrypt = (key: Buffer, plaintext: Buffer | string): Buffer => {
	const cipher = crypto.createCipheriv(`aes-${key.length * 8}-ecb`, key, null);
	return Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
};

const aesEcbDecrypt = (key: Buffer | string, ciphertext: Buffer): Buffer => {
	const keyBuf = typeof key === "string" ? Buffer.from(key, "utf8") : key;
	const decipher = crypto.createDecipheriv(
		`aes-${keyBuf.length * 8}-ecb`,
		keyBuf,
		null,
	);
	return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
};

const createX25519PublicKey = (raw: Buffer): crypto.KeyObject =>
	crypto.createPublicKey({
		key: Buffer.concat([x25519SpkiPrefix, raw]),
		format: "der",
		type: "spki",
	});

const deriveX25519AesKey = (
	sharedSecret: Buffer,
	ephemeralPublicKey: Buffer,
): Buffer => {
	const prk = crypto
		.createHmac("sha256", Buffer.alloc(32))
		.update(sharedSecret.length ? sharedSecret : Buffer.alloc(32))
		.digest();
	return crypto
		.createHmac("sha256", prk)
		.update(Buffer.concat([ephemeralPublicKey, Buffer.from([1])]))
		.digest()
		.subarray(0, 16);
};

/** HMAC-SHA256(timestamp + nonce) as base64. */
export const xeapiSign = (
	timestamp: number | string,
	nonce: string,
): string => {
	return crypto
		.createHmac("sha256", xeapiSignKey)
		.update(String(timestamp) + nonce)
		.digest("base64");
};

const xeapiMidTransform = (ciphertext: Buffer): Buffer => {
	const random = crypto.randomBytes(16);
	const xored = Buffer.alloc(ciphertext.length);
	for (let i = 0; i < ciphertext.length; i++) {
		xored[i] = ciphertext[i] ^ random[i & 0x0f];
	}
	const b64 = Buffer.from(xored.toString("base64"));
	const rot = b64.length ? (random[0] & 0x0f) % b64.length : 0;
	return Buffer.concat([random, b64.subarray(rot), b64.subarray(0, rot)]);
};

const xeapiEncryptS = (
	dynamicKey: Buffer,
	publicKeyState: XeapiPublicKeyState,
	os: string,
): Buffer => {
	const peerRaw = Buffer.from(publicKeyState.publicKey, "base64");
	const peerKey = createX25519PublicKey(peerRaw);
	const { publicKey, privateKey } = crypto.generateKeyPairSync("x25519");
	const ephemeralRaw = Buffer.from(
		publicKey.export({ format: "der", type: "spki" }),
	).subarray(-32);
	const sharedSecret = crypto.diffieHellman({
		privateKey,
		publicKey: peerKey,
	});
	const aesKey = deriveX25519AesKey(sharedSecret, ephemeralRaw);
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-128-gcm", aesKey, iv);
	const plaintext = Buffer.from(
		`${dynamicKey.toString("base64")}|${os}|${publicKeyState.sk || ""}`,
	);
	const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	return Buffer.concat([ephemeralRaw, iv, encrypted, cipher.getAuthTag()]);
};

const buildXeapiPlaintext = (
	uri: string,
	data: Record<string, unknown> | null | undefined,
	options: XeapiOptions = {},
): string => {
	const fields: Record<string, string> = {};
	const contentType =
		options.contentType || "application/x-www-form-urlencoded;charset=utf-8";
	const mediaType = contentType.split(";", 1)[0].toLowerCase();
	if (mediaType !== "application/x-www-form-urlencoded") {
		fields.contentType = contentType;
	}

	const method = (options.method || "POST").toUpperCase();
	if (method !== "POST") fields.method = method;

	const url = new URL(uri, "https://interface.music.163.com");
	if (url.search) fields.queryString = url.search.slice(1);

	if (data !== undefined && data !== null) {
		const bodyData = { ...(data as Record<string, string>) };
		delete bodyData.e_r;
		const body = Buffer.from(new URLSearchParams(bodyData).toString());
		fields.body = body.toString("base64");
	}

	if (fields.queryString) {
		fields.queryString += "&e_r=true";
	} else {
		fields.queryString = "e_r=true";
	}
	return JSON.stringify(fields);
};

/**
 * xeapi request encryption -> { B, S, R } (all base64).
 * Uses crypto.randomBytes(16) + a fresh X25519 ephemeral keypair unless a
 * sessionKey is supplied - nondeterministic by design.
 */
export const xeapi = (
	uri: string,
	data: Record<string, unknown> | null | undefined,
	options: XeapiOptions = {},
): { B: string; S: string; R: string } => {
	const publicKeyState = options.publicKeyState;
	if (!publicKeyState) {
		throw new Error("xeapi publicKeyState is required");
	}
	const activeSessionKey = options.sessionKey
		? Buffer.from(String(options.sessionKey))
		: null;
	const activeSessionId = options.sessionId || "";
	const dynamicKey = activeSessionKey || crypto.randomBytes(16);
	const plaintext = Buffer.from(buildXeapiPlaintext(uri, data, options));
	const b = aesEcbEncrypt(
		dynamicKey,
		xeapiMidTransform(aesEcbEncrypt(xeapiStaticKey, plaintext)),
	);
	const s = xeapiEncryptS(dynamicKey, publicKeyState, options.os || "android");
	const r = aesEcbEncrypt(
		xeapiStaticKey,
		Buffer.from(
			`${publicKeyState.version}|${activeSessionKey ? activeSessionId : ""}`,
		),
	);
	return {
		B: b.toString("base64"),
		S: s.toString("base64"),
		R: r.toString("base64"),
	};
};

/** xeapi response decryption (AES-128-ECB with eapiKey; gzip sniffed). */
export const xeapiResDecrypt = (body: Buffer): unknown => {
	const decrypted = aesEcbDecrypt(eapiKey, body);
	const plaintext =
		decrypted[0] === 0x1f && decrypted[1] === 0x8b
			? gunzipSync(decrypted)
			: decrypted;
	return JSON.parse(plaintext.toString());
};

/** Decrypt the RSA/AES-wrapped xeapi server public-key envelope. */
export const xeapiDecryptPublicKey = (encryptedData: string): unknown => {
	return JSON.parse(
		aesEcbDecrypt(
			xeapiStaticKey,
			Buffer.from(encryptedData, "base64"),
		).toString(),
	);
};
