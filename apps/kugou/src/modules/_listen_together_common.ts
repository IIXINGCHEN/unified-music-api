// 内部辅助：KuGouMusicApi/module/_listen_together_common.js 的 TS 移植。
// 不挂载路由，仅供 listen_together_* 模块内部复用；行为与原版逐行一致。

import type { KgRequestFn, KgResponse } from "@music-api/kugou-core";

export const YOUTH_BASE = "https://youth.kugou.com";
export const GATEWAY_BASE = "https://gateway.kugou.com";
export const SELF_STUDY_BIZ = "1000";
export const MUSIC_ROOM_BIZ = "1009";
export const DEFAULT_MUSIC_ROOM_BG =
	"https://youthimgbssdl.kugou.com/6e9cdcef8d163d06225d8cbeaa2f1ece.JPEG";

const parseJsonValue = (value: any, fallback: any): any => {
	if (value === undefined || value === null || value === "") return fallback;
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
};

export const parseObject = (
	value: any,
	fallback: any = {},
): Record<string, any> => {
	const parsed = parseJsonValue(value, fallback);
	return parsed && typeof parsed === "object" && !Array.isArray(parsed)
		? parsed
		: fallback;
};

export const parseArray = (value: any): any[] => {
	const parsed = parseJsonValue(value, []);
	return Array.isArray(parsed) ? parsed : [];
};

export const authBody = (
	params: Record<string, any>,
): { userid: number; token: string } => ({
	userid: Number(params?.userid || params?.cookie?.userid || 0),
	token: params?.token || params?.cookie?.token || "",
});

export const musicRoomAudios = (
	params: Record<string, any>,
): Array<{ hash: string; mixsongid: any; fid: any }> =>
	parseArray(params?.audios)
		.slice(0, 50)
		.map((audio: any) => ({
			hash: audio?.hash || "",
			mixsongid: audio?.mixsongid ?? audio?.mixSongId ?? "",
			fid: audio?.fid ?? 0,
		}))
		.filter((audio: any) => audio.hash);

export interface ListenTogetherOperation {
	baseURL?: string;
	url: string;
	method: string;
	params?: (input: Record<string, any>) => Record<string, any>;
	data?: (input: Record<string, any>) => any;
}

export const createDomainHandler =
	(operations: Record<string, ListenTogetherOperation>) =>
	(params: Record<string, any>, useAxios: KgRequestFn): Promise<KgResponse> => {
		// IPC POST 数据位于 body，HTTP 调用也可能把简单参数放在 query；领域模块统一读取。
		const body = parseObject(params?.body);
		const input: Record<string, any> = {
			...params,
			...body,
			cookie: params?.cookie || {},
		};
		const operation = input.operation;
		const config = operations[operation];
		if (!config) {
			return Promise.reject({
				status: 400,
				body: {
					status: 0,
					error_code: 400,
					error_msg: `不支持的操作: ${operation || ""}`,
				},
			});
		}

		const options: {
			baseURL: string;
			url: string;
			method: string;
			encryptType: string;
			cookie: Record<string, any>;
			params?: Record<string, any>;
			data?: any;
		} = {
			baseURL: config.baseURL || YOUTH_BASE,
			url: config.url,
			method: config.method,
			encryptType: "android",
			cookie: { ...(input.cookie || {}) },
		};
		if (config.params) options.params = config.params(input);
		if (config.data) options.data = config.data(input);
		else if (config.method === "POST") options.data = {};
		return useAxios(options);
	};
