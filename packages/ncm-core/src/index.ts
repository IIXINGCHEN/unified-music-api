/**
 * @music-api/ncm-core — 网易云 API 基础设施层 (P1c).
 * Hand port of api-enhanced util/{request,option,index,fileHelper,ncbl}.js.
 */

export {
	API_DOMAIN,
	APP_CONF,
	chooseUserAgent,
	CLIENTLOG_DOMAIN3,
	DOMAIN,
	EAPI_DOMAIN,
	resourceTypeMap,
	SPECIAL_STATUS_CODES,
	XEAPI_DOMAIN,
} from "./config.js";
export type { FileLike, MemoryFile } from "./fileHelper.js";
export {
	cleanupTempFile,
	getFileExtension,
	getFileMd5,
	getFileSize,
	getUploadData,
	isTempFile,
	readFileChunk,
	sanitizeFilename,
	uploadFile,
} from "./fileHelper.js";
export {
	getCnIp,
	getDeviceId,
	resetGlobalState,
	setCnIp,
	setDeviceId,
} from "./globalState.js";
export type { NcmModuleFn, NcmQuery, NcmRequestFn } from "./module.js";
export { defineModule } from "./module.js";
export type {
	EncryptNcbLOpts,
	MultipartParts,
	NcblAppCtx,
	NcblAuthCtx,
	NcblCtx,
	NcblDeviceCtx,
	NcblRecordInput,
	NcblUploadResult,
	PlvPldCtx,
	PlvSong,
	PlvSource,
} from "./ncbl.js";
export {
	buildCookieStr,
	buildMetaJson,
	buildMultipart,
	buildPld,
	buildPlv,
	buildRecord,
	buildRecords,
	chacha20,
	DEFAULT_MAX_FRAME,
	doUpload,
	encryptNCBL,
	extractContext,
	FIELD_SEP,
	getCompress,
	HEADER_FIXED_LEN,
	MAGIC,
	META_BLOCK_TYPE,
	NCBL_VERSION,
	parseCookie,
	randomHex,
	randomUUID,
	rsaWrap,
} from "./ncbl.js";
export { createOption } from "./option.js";
export type { NcmRequestOptions, NcmResponse } from "./request.js";
export { createRequest, resetRequestState } from "./request.js";
export type { NcmCoreInit } from "./tokenStore.js";
export {
	getAnonymousToken,
	getCheckToken,
	initNcmCore,
	loadXeapiPublicKey,
	resetTokenStore,
} from "./tokenStore.js";
export {
	cookieObjToString,
	cookieToJson,
	generateChainId,
	generateDeviceId,
	generateRandomChineseIP,
	getCookieValue,
	getRandom,
	toBoolean,
} from "./utils.js";
