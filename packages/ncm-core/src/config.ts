/**
 * Runtime constants for @music-api/ncm-core.
 * Values copied verbatim from api-enhanced/util/config.json (APP_CONF).
 * (config.json itself is not shipped; only the fields request.js needs.)
 */
export const DOMAIN = "https://music.163.com";
export const API_DOMAIN = "https://interface.music.163.com";
export const EAPI_DOMAIN = "https://interfacepc.music.163.com";
export const XEAPI_DOMAIN = "https://interface3.music.163.com";
/** NCBL log-upload domain (api-enhanced/util/ncbl.js DOMAIN3). */
export const CLIENTLOG_DOMAIN3 = "https://clientlog3.music.163.com";

/** Default to eapi encryption when a module passes crypto: ''. */
export const ENCRYPT_DEFAULT = true;
/** Default e_r (response encryption) flag. */
export const ENCRYPT_RESPONSE_DEFAULT = false;

/** Business codes that are normalized to HTTP 200 (body.code carries the truth). */
export const SPECIAL_STATUS_CODES = new Set([
	201, 302, 400, 502, 800, 801, 802, 803,
]);

export interface OsProfile {
	os: string;
	appver: string;
	osver: string;
	channel: string;
}

export const OS_MAP: Record<string, OsProfile> = {
	pc: {
		os: "pc",
		appver: "3.1.17.204416",
		osver: "Microsoft-Windows-10-Professional-build-19045-64bit",
		channel: "netease",
	},
	linux: {
		os: "linux",
		appver: "1.2.1.0428",
		osver: "Deepin 20.9",
		channel: "netease",
	},
	android: {
		os: "android",
		appver: "8.20.20.231215173437",
		osver: "14",
		channel: "xiaomi",
	},
	iphone: {
		os: "iPhone OS",
		appver: "9.0.90",
		osver: "16.2",
		channel: "distribution",
	},
	osx: {
		os: "osx",
		appver: "3.1.10.5100",
		osver: "15.5",
		channel: "netease",
	},
};

export const USER_AGENT_MAP: Record<string, Record<string, string>> = {
	weapi: {
		pc: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
	},
	linuxapi: {
		linux:
			"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36",
	},
	api: {
		pc: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.164 NeteaseMusicDesktop/3.1.29.205117",
		android:
			"NeteaseMusic/9.5.61.260802021928(9005061);Dalvik/2.1.0 (Linux; U; Android 12; HBN-AL00 Build/cd737a2.0)",
		iphone: "NeteaseMusic 9.0.90/5038 (iPhone; iOS 16.2; zh_CN)",
	},
};

/** macOS desktop UA used by the eapi branch when cookie.os === 'osx'. */
export const OSX_DESKTOP_UA =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const chooseUserAgent = (crypto: string, uaType = "pc"): string => {
	return USER_AGENT_MAP[crypto]?.[uaType] || "";
};

/** Verbatim copy of api-enhanced/util/config.json APP_CONF (needed by modules). */
export const APP_CONF = {
	apiDomain: "https://interface.music.163.com",
	eapiDomain: "https://interfacepc.music.163.com",
	xeapiDomain: "https://interface3.music.163.com",
	domain: "https://music.163.com",
	clDomian: "https://clientlog.music.163.com",
	clDomian3: "https://clientlog3.music.163.com",
	dunDomainV3: "https://ac.dun.163yun.com",
	dunStaticDomain: "https://acstatic-dun.126.net",
	encrypt: true,
	encryptResponse: false,
	clientSign:
		"18:C0:4D:B9:8F:FE@@@453832335F384641365F424635335F303030315F303031425F343434415F343643365F333638332@@@@@@6ff673ef74955b38bce2fa8562d95c976ed4758b1227c4e9ee345987cee17bc9",
	checkToken:
		"9ca17ae2e6ffcda170e2e6ee8af14fbabdb988f225b3868eb2c15a879b9a83d274a790ac8ff54a97b889d5d42af0feaec3b92af58cff99c470a7eafd88f75e839a9ea7c14e909da883e83fb692a3abdb6b92adee9e",
} as const;

/** Verbatim copy of api-enhanced/util/config.json resourceTypeMap. */
export const resourceTypeMap: Record<string, string> = {
	"0": "R_SO_4_",
	"1": "R_MV_5_",
	"2": "A_PL_0_",
	"3": "R_AL_3_",
	"4": "A_DJ_1_",
	"5": "R_VI_62_",
	"6": "A_EV_2_",
	"7": "A_DR_14_",
};
