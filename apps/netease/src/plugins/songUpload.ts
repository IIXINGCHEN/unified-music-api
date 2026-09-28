/**
 * Song upload plugin for @music-api/netease.
 * Port of api-enhanced/plugins/songUpload.js (axios -> fetch).
 */
import {
	createOption,
	getFileExtension,
	getUploadData,
	type NcmQuery,
	type NcmRequestFn,
	type NcmResponse,
	sanitizeFilename,
} from "@music-api/ncm-core";
import { logger } from "../logger.js";

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
	const resp = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
	if (!resp.ok) {
		throw new Error(`Request failed with status code ${resp.status}`);
	}
	return resp.json();
}

export default async function songUploadPlugin(
	query: NcmQuery,
	request: NcmRequestFn,
): Promise<NcmResponse> {
	const ext = getFileExtension(query.songFile.name);
	const filename = sanitizeFilename(query.songFile.name);
	const bucket = "jd-musicrep-privatecloud-audio-public";

	const tokenRes = await request(
		`/api/nos/token/alloc`,
		{
			bucket: bucket,
			ext: ext,
			filename: filename,
			local: false,
			nos_product: 3,
			type: "audio",
			md5: query.songFile.md5,
		},
		createOption(query, "weapi"),
	);

	if (!tokenRes.body.result?.objectKey) {
		logger.error("Token分配失败:", tokenRes.body);
		throw {
			status: 500,
			body: {
				code: 500,
				msg: "获取上传token失败",
				detail: tokenRes.body,
			},
		};
	}

	const objectKey = tokenRes.body.result.objectKey.replace(/\//g, "%2F");
	let lbs: {
		upload?: string[];
		// biome-ignore lint/suspicious/noExplicitAny: upstream shape
		[key: string]: any;
	};
	try {
		lbs = (await fetchJson(
			`https://wanproxy.127.net/lbs?version=1.0&bucketname=${bucket}`,
			10000,
		)) as typeof lbs;
	} catch (error) {
		logger.error("LBS获取失败:", (error as Error).message);
		throw {
			status: 500,
			body: {
				code: 500,
				msg: "获取上传服务器地址失败",
				detail: (error as Error).message,
			},
		};
	}

	if (!lbs?.upload?.[0]) {
		logger.error("无效的LBS响应:", lbs);
		throw {
			status: 500,
			body: {
				code: 500,
				msg: "获取上传服务器地址无效",
				detail: lbs,
			},
		};
	}

	try {
		const uploadResp = await fetch(
			`${lbs.upload[0]}/${bucket}/${objectKey}?offset=0&complete=true&version=1.0`,
			{
				method: "POST",
				headers: {
					"x-nos-token": tokenRes.body.result.token,
					"Content-MD5": query.songFile.md5,
					"Content-Type": query.songFile.mimetype || "audio/mpeg",
					"Content-Length": String(query.songFile.size),
				},
				body: getUploadData(query.songFile) as unknown as BodyInit,
				signal: AbortSignal.timeout(300000),
			},
		);
		if (!uploadResp.ok) {
			const data = await uploadResp.text();
			const error = new Error(
				`Request failed with status code ${uploadResp.status}`,
			) as Error & { response?: { status: number; data: unknown } };
			error.response = { status: uploadResp.status, data };
			throw error;
		}
		logger.info("上传成功:", filename);
	} catch (error) {
		const err = error as Error & {
			response?: { status: number; data: unknown };
		};
		logger.error("上传失败:", {
			status: err.response?.status,
			data: err.response?.data,
			message: err.message,
		});
		throw {
			status: err.response?.status || 500,
			body: {
				code: err.response?.status || 500,
				msg: "文件上传失败",
				detail: err.response?.data || err.message,
			},
		};
	}
	return {
		...tokenRes,
	};
}
