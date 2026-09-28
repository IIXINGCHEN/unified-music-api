/**
 * /api handler — port of src/service/api.js.
 *
 * DEVIATION: the default `server` changed from 'tencent' to 'spotify'
 * (tencent provider dropped in the P4 scope decision).
 */
import type { Context } from "hono";
import { Providers } from "../providers/index.js";
import type { ProviderHandle } from "../providers/types.js";
import { get_url, format as lyricFormat } from "../util.js";

interface TrackItem {
	url?: string;
	pic?: string;
	lrc?: string;
	[key: string]: unknown;
}

/** Minimal registry surface the handler needs (test seam). */
export interface ProviderSource {
	get_provider_list(): string[];
	get(name: string): ProviderHandle | undefined;
}

const FILL_FIELDS = ["url", "pic", "lrc"] as const;

export function createApiHandler(
	source: ProviderSource = new Providers(),
): (c: Context) => Promise<Response> {
	return async (c: Context): Promise<Response> => {
		const p = source;

		const query = c.req.query();
		const server = query.server || "spotify";
		const type = query.type || "playlist";
		const id = query.id || "7326220405";

		const provider = p.get(server);
		if (
			!p.get_provider_list().includes(server) ||
			!provider?.support_type.includes(type)
		) {
			c.status(400);
			return c.json({
				status: 400,
				message: "server 参数不合法",
				param: { server, type, id },
			});
		}

		const data: unknown = await provider.handle(type, id);

		if (type === "url") {
			const url = data as string;
			if (!url) {
				c.status(403);
				return c.json({ error: "no url" });
			}
			if (url.startsWith("@")) return c.text(url);

			return c.redirect(url);
		}

		if (type === "pic") {
			return c.redirect(data as string);
		}

		if (type === "lrc") {
			const lyric = data as { lyric: string; tlyric?: string };
			return c.text(lyricFormat(lyric.lyric, lyric.tlyric || ""));
		}

		// json 类型数据填充api
		const list = data as TrackItem[];
		return c.json(
			list.map((x) => {
				for (const i of FILL_FIELDS) {
					const v = String(x[i] ?? "");
					// 正常对象均为id，以下例外不用填充：
					// 1.@开头/size为0 => qq音乐jsonp 2.已存在完整链接
					if (!v.startsWith("@") && !v.startsWith("http") && v.length > 0) {
						x[i] = `${get_url(c)}?server=${server}&type=${i}&id=${v}`;
					}
				}
				return x;
			}),
		);
	};
}

export default createApiHandler();
