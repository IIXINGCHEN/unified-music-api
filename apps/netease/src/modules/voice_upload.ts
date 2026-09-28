// 声音上传（播客/声音动态）
import fs from "node:fs";
import {
	createOption,
	defineModule,
	getFileExtension,
	type NcmQuery,
	type NcmRequestFn,
	readFileChunk,
} from "@music-api/ncm-core";
import uploadPlugin from "../plugins/upload.js";

interface AxiosLikeConfig {
	method: string;
	url: string;
	headers?: Record<string, string>;
	// biome-ignore lint/suspicious/noExplicitAny: axios-compatible shim
	data?: any;
}
interface AxiosLikeResponse {
	// biome-ignore lint/suspicious/noExplicitAny: axios-compatible shim
	data: any;
	headers: Record<string, string>;
}
type AxiosLike = (config: AxiosLikeConfig) => Promise<AxiosLikeResponse>;

/** fetch-based axios-compatible shim (rejects on non-2xx like axios). */
const fetchAsAxios: AxiosLike = async (config) => {
	const resp = await fetch(config.url, {
		method: config.method.toUpperCase(),
		headers: config.headers,
		body: (config.data ?? null) as BodyInit | null,
	});
	if (!resp.ok) {
		throw new Error(`Request failed with status code ${resp.status}`);
	}
	const headers: Record<string, string> = {};
	resp.headers.forEach((v, k) => {
		headers[k] = v;
	});
	return { data: await resp.text(), headers };
};

function createDupkey(): string {
	const s: string[] = [];
	const hexDigits = "0123456789abcdef";
	for (let i = 0; i < 36; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[14] = "4";
	// NOTE: 原实现此处依赖 JS 隐式转换：s[19] 是 16 进制字符，"a"-"f" 经 & 运算
	// ToNumber 得 NaN → ToInt32 得 0。Number(s[19]) 精确复刻该语义。
	s[19] = hexDigits.substr((Number(s[19]) & 0x3) | 0x8, 1);
	s[8] = s[13] = s[18] = s[23] = "-";
	return s.join("");
}

interface VoiceUploadDeps {
	axios?: AxiosLike;
	uploadPlugin?: typeof uploadPlugin;
}

export default defineModule(
	async (
		query: NcmQuery,
		request: NcmRequestFn,
		dependencies: VoiceUploadDeps = {},
	) => {
		if (!query.songFile) {
			return Promise.reject({
				status: 500,
				body: {
					msg: "请上传音频文件",
					code: 500,
				},
			});
		}

		const axiosRequest = dependencies.axios || fetchAsAxios;
		const uploadImage = dependencies.uploadPlugin || uploadPlugin;
		const ext = getFileExtension(query.songFile.name);
		const filename =
			query.songName ||
			query.songFile.name
				.replace(`.${ext}`, "")
				.replace(/\s/g, "")
				.replace(/\./g, "_");
		const coverImgId = query.imgFile
			? (await uploadImage(query, request)).imgId
			: query.coverImgId;

		const tokenRes = await request(
			`/api/nos/token/alloc`,
			{
				bucket: "ymusic",
				ext: ext,
				filename: filename,
				local: false,
				nos_product: 0,
				type: "other",
			},
			createOption(query, "weapi"),
		);

		const objectKey = tokenRes.body.result.objectKey.replace(/\//g, "%2F");
		const docId = tokenRes.body.result.docId;
		const res = await axiosRequest({
			method: "post",
			url: `https://ymusic.nos-hz.163yun.com/${objectKey}?uploads`,
			headers: {
				"x-nos-token": tokenRes.body.result.token,
				"X-Nos-Meta-Content-Type": query.songFile.mimetype || "audio/mpeg",
			},
			data: null,
		});

		// S3 InitiateMultipartUploadResult XML; xml2js explicitArray semantics:
		// res2.InitiateMultipartUploadResult.UploadId[0]
		const uploadIdMatch = /<UploadId>([^<]+)<\/UploadId>/.exec(
			String(res.data),
		);
		const uploadId = uploadIdMatch ? uploadIdMatch[1] : "";

		const useTempFile = !!query.songFile.tempFilePath;
		let fileSize = query.songFile.size;

		if (useTempFile) {
			const stats = await fs.promises.stat(query.songFile.tempFilePath);
			fileSize = stats.size;
		}

		const blockSize = 10 * 1024 * 1024;
		let offset = 0;
		let blockIndex = 1;

		const etags: string[] = [];

		while (offset < fileSize) {
			let chunk: Buffer;
			if (useTempFile) {
				chunk = await readFileChunk(
					query.songFile.tempFilePath,
					offset,
					Math.min(blockSize, fileSize - offset),
				);
			} else {
				chunk = query.songFile.data.slice(
					offset,
					Math.min(offset + blockSize, fileSize),
				);
			}

			const res3 = await axiosRequest({
				method: "put",
				url: `https://ymusic.nos-hz.163yun.com/${objectKey}?partNumber=${blockIndex}&uploadId=${uploadId}`,
				headers: {
					"x-nos-token": tokenRes.body.result.token,
					"Content-Type": query.songFile.mimetype || "audio/mpeg",
				},
				data: chunk,
			});
			const etag = res3.headers.etag;
			etags.push(etag);
			offset += blockSize;
			blockIndex++;
		}

		let completeStr = "<CompleteMultipartUpload>";
		for (let i = 0; i < etags.length; i++) {
			completeStr += `<Part><PartNumber>${i + 1}</PartNumber><ETag>${
				etags[i]
			}</ETag></Part>`;
		}
		completeStr += "</CompleteMultipartUpload>";

		await axiosRequest({
			method: "post",
			url: `https://ymusic.nos-hz.163yun.com/${objectKey}?uploadId=${uploadId}`,
			headers: {
				"Content-Type": "text/plain;charset=UTF-8",
				"X-Nos-Meta-Content-Type": query.songFile.mimetype || "audio/mpeg",
				"x-nos-token": tokenRes.body.result.token,
			},
			data: completeStr,
		});

		const voiceData = JSON.stringify([
			{
				name: filename,
				// biome-ignore lint/suspicious/noDoubleEquals: query params arrive as strings; loose equality is intentional (matches original)
				autoPublish: query.autoPublish == 1,
				autoPublishText: query.autoPublishText || "",
				description: query.description,
				voiceListId: query.voiceListId,
				coverImgId,
				dfsId: docId,
				categoryId: query.categoryId,
				secondCategoryId: query.secondCategoryId,
				composedSongs: query.composedSongs
					? query.composedSongs.split(",")
					: [],
				// biome-ignore lint/suspicious/noDoubleEquals: query params arrive as strings; loose equality is intentional (matches original)
				privacy: query.privacy == 1,
				publishTime: query.publishTime || 0,
				orderNo: query.orderNo || 1,
			},
		]);

		await request(
			`/api/voice/workbench/voice/batch/upload/preCheck`,
			{
				dupkey: createDupkey(),
				voiceData,
			},
			{
				...createOption(query),
				headers: {
					"x-nos-token": tokenRes.body.result.token,
				},
			},
		);
		const result = await request(
			`/api/voice/workbench/voice/batch/upload/v2`,
			{
				dupkey: createDupkey(),
				voiceData,
			},
			{
				...createOption(query),
				headers: {
					"x-nos-token": tokenRes.body.result.token,
				},
			},
		);
		return {
			status: 200,
			body: {
				code: 200,
				data: result.body.data,
			},
		};
	},
);
