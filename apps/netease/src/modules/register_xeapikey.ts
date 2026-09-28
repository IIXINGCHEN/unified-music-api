import {
	APP_CONF,
	defineModule,
	getDeviceId,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";
import { xeapiDecryptPublicKey, xeapiSign } from "@music-api/ncm-crypto";

const generateNonce = (): string => {
	let nonce = "";
	for (let i = 0; i < 16; i++) {
		nonce += Math.floor(Math.random() * 10).toString();
	}
	return nonce;
};

export default defineModule(async (query: NcmQuery, _request: NcmRequestFn) => {
	const nonce = generateNonce();
	const timestamp = String(Date.now());
	const deviceId = query.deviceId || getDeviceId() || "";
	const currentKeyVersion = query.currentKeyVersion || "";

	const data = {
		appVersion: "9.5.61",
		currentKeyVersion,
		deviceId,
		nonce,
		os: "android",
		requestType: "active",
		signature: xeapiSign(timestamp, nonce),
		t1: "",
		t2: "",
		timestamp,
		uid: "",
	};

	const resp = await fetch(
		`${APP_CONF.apiDomain}/api/gorilla/anti/crawler/security/key/get`,
		{
			method: "POST",
			headers: {
				"User-Agent":
					"NeteaseMusic/9.5.61.260802021928(9005061);Dalvik/2.1.0 (Linux; U; Android 12; HBN-AL00 Build/cd737a2.0)",
				Cookie: deviceId ? `deviceId=${encodeURIComponent(deviceId)}` : "",
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams(data).toString(),
		},
	);
	if (!resp.ok) {
		throw new Error(`Request failed with status code ${resp.status}`);
	}
	const resData = await resp.json();

	if (resData?.code !== 200 || !resData?.data?.encryptedData) {
		throw new Error("xeapi public key request failed");
	}
	if (
		!resData.data.signature ||
		xeapiSign(resData.data.timestamp, nonce) !== resData.data.signature
	) {
		throw new Error("xeapi public key response signature mismatch");
	}

	const publicKey = xeapiDecryptPublicKey(resData.data.encryptedData) as {
		sk?: string;
		// biome-ignore lint/suspicious/noExplicitAny: upstream key envelope
		[key: string]: any;
	};
	if (!publicKey.sk) {
		throw new Error("xeapi public key response missing sk");
	}

	return {
		status: 200,
		body: {
			...publicKey,
			deviceId,
		},
		cookie: [],
	};
});
