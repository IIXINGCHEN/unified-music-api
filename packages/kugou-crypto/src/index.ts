// @music-api/kugou-crypto
// 酷狗签名/加密核心：手写移植自 KuGouMusicApi util/crypto.js + util/helper.js + util/util.js。
// 导出名与原 module.exports 对齐（原 crypto.js 的 CryptoJS 内部辅助 wordArrayFromBuffer
// 无 TS 等价物：其唯一外部用途（helper.js Buffer 增量 MD5）已由 node:crypto 原生实现，故不导出）。

export {
	calculateMid,
	cookieToJson,
	decodeLyrics,
	generateWebGLHash,
	getGuid,
	isUUIDv4,
	parseCookieString,
	randomNumber,
	randomString,
} from "./codec.js";
export {
	apiver,
	appid,
	clientver,
	liteAppid,
	liteClientver,
	qq_appid,
	qq_lite_appid,
	srcappid,
	wx_appid,
	wx_lite_appid,
	wx_lite_secret,
	wx_secret,
} from "./config.js";
export type { AesEncryptOptions, PlaylistCipher } from "./crypto.js";
export {
	cryptoAesDecrypt,
	cryptoAesEncrypt,
	cryptoMd5,
	cryptoRSAEncrypt,
	cryptoSha1,
	playlistAesDecrypt,
	playlistAesEncrypt,
	publicLiteRasKey,
	publicRasKey,
	rsaEncrypt2,
} from "./crypto.js";
export {
	signatureAndroidParams,
	signatureRegisterParams,
	signatureWebParams,
	signCloudKey,
	signKey,
	signParams,
	signParamsKey,
} from "./signers.js";
