/**
 * @music-api/ncm-crypto - NetEase Cloud Music request encryption.
 *
 * Hand-ported, byte-exact TypeScript port of
 * music-api-audit/repos/api-enhanced/util/crypto.js.
 *
 * Notable deliberate quirks preserved from the original:
 *  - decrypt() derives its AES key via EvpKDF(MD5) with a random salt on
 *    every call (the original passes eapiKey as a string to CryptoJS),
 *    so it is nondeterministic and has no callers (debug helper only).
 *  - aesDecrypt returns a Buffer here (the original returns a CryptoJS
 *    WordArray); callers convert with .toString('utf8') / .toString('base64')
 *    instead of .toString(CryptoJS.enc.Utf8 / CryptoJS.enc.Base64).
 */

export { decrypt, eapi, eapiReqDecrypt, eapiResDecrypt } from "./eapi.js";
export { linuxapi } from "./linuxapi.js";
export { aesDecrypt, aesEncrypt, rsaEncrypt, weapi } from "./weapi.js";
export type { XeapiOptions, XeapiPublicKeyState } from "./xeapi.js";
export {
	xeapi,
	xeapiDecryptPublicKey,
	xeapiResDecrypt,
	xeapiSign,
} from "./xeapi.js";
