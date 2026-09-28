/**
 * Shared helpers — port of Meting-API/src/util.js.
 */
import type { Context } from "hono";

interface LyricLine {
	time: number;
	text: string;
}

const trimLyric = (lyric: string): LyricLine[] => {
	const result: LyricLine[] = [];
	const lines = lyric.split("\n");
	for (const line of lines) {
		// 匹配两种格式：[mm:ss.xx] 或 [mm:ss:xx]
		const match = line.match(/^\[(\d{2}):(\d{2})[.:](\d+)\](.*)$/);
		if (match) {
			const minutes = Number.parseInt(match[1], 10);
			const seconds = Number.parseInt(match[2], 10);
			const milliseconds = Number.parseInt(
				match[3].padEnd(3, "0").slice(0, 3),
				10,
			);
			result.push({
				time: minutes * 60000 + seconds * 1000 + milliseconds,
				text: match[4],
			});
		}
	}
	return result.sort((a, b) => a.time - b.time);
};

/** Merge original + translated lyric lines by timestamp. */
export function format(lyric: string, tlyric: string): string {
	const lyricArray = trimLyric(lyric);
	const tlyricArray = trimLyric(tlyric);
	if (tlyricArray.length === 0) {
		return lyric;
	}
	const result: LyricLine[] = [];
	for (
		let i = 0, j = 0;
		i < lyricArray.length && j < tlyricArray.length;
		i += 1
	) {
		const time = lyricArray[i].time;
		let text = lyricArray[i].text;
		while (time > tlyricArray[j].time && j + 1 < tlyricArray.length) {
			j += 1;
		}
		if (time === tlyricArray[j].time && tlyricArray[j].text.length) {
			text = `${text} (${tlyricArray[j].text})`;
		}
		result.push({ time, text });
	}
	return result
		.map((x) => {
			const minus = Math.floor(x.time / 60000)
				.toString()
				.padStart(2, "0");
			const second = Math.floor((x.time % 60000) / 1000)
				.toString()
				.padStart(2, "0");
			const millisecond = Math.floor(x.time % 1000)
				.toString()
				.padStart(3, "0");
			return `[${minus}:${second}.${millisecond}]${x.text}`;
		})
		.join("\n");
}

export const getPathFromURL = (url: string, strict = true): string => {
	const queryIndex = url.indexOf("?");
	const result = url.substring(
		url.indexOf("/", 8),
		queryIndex === -1 ? url.length : queryIndex,
	);
	if (strict === false && result.endsWith("/")) {
		return result.slice(0, -1);
	}
	return result;
};

export const get_runtime = (): string => {
	const g = globalThis as Record<string, unknown>;
	const proc = g.process as
		| { env?: Record<string, string | undefined>; release?: { name?: string } }
		| undefined;
	if (proc?.env?.RUNTIME) {
		return proc.env.RUNTIME;
	}
	if (g.Deno !== undefined) return "deno";
	if (g.Bun !== undefined) return "bun";
	if (typeof g.WebSocketPair === "function") return "cloudflare";
	if (g.fastly !== undefined) return "fastly";
	if (typeof g.EdgeRuntime === "string") return "vercel";
	if (proc?.release?.name === "node") {
		return "node";
	}
	if (g.__lagon__ !== undefined) return "lagon";
	return "other";
};

export const get_url = (c: Context): string => {
	const runtime = get_runtime();
	const prefix =
		c.req.header("X-Forwarded-Host") || c.req.header("X-Forwarded-Url");
	let req_url = prefix
		? prefix + getPathFromURL(c.req.url.split("?")[0])
		: c.req.url.split("?")[0];
	if (!req_url.startsWith("http")) req_url = `http://${req_url}`;
	if (runtime === "vercel") req_url = req_url.replace("http://", "https://");
	return req_url;
};
