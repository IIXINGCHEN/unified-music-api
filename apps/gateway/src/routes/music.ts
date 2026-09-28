/**
 * Music API routes: GET /api/v1/match|ncmget|other|search|info|picture|lyric
 *
 * Ports Go `internal/controller/music_controller.go` including the
 * substring-based error -> HTTP status mapping.
 */

import type { Context } from "hono";
import { Hono } from "hono";
import { badRequest, fail, internalError, ok } from "../response.js";
import type { MusicService } from "../services.js";

function mapError(
	c: Context,
	err: unknown,
	mapping: Array<[string, (msg: string) => ReturnType<typeof badRequest>]>,
) {
	const msg = err instanceof Error ? err.message : String(err);
	for (const [substr, fn] of mapping) {
		if (msg.includes(substr)) return fn(msg);
	}
	return internalError(c, msg);
}

const std400 = (c: Context) => (msg: string) => badRequest(c, msg);
const std429 = (c: Context) => (msg: string) => fail(c, 429, 429, msg);
const std404 = (c: Context) => (msg: string) => fail(c, 404, 404, msg);
const std503 = (c: Context) => (msg: string) => fail(c, 503, 503, msg);

export function musicRoutes(svc: MusicService): Hono {
	const app = new Hono();

	// GET /api/v1/match?id=&server=
	app.get("/api/v1/match", async (c) => {
		const id = c.req.query("id") ?? "";
		const server = c.req.query("server") ?? "";
		if (!id) return badRequest(c, "音乐ID不能为空");
		try {
			const result = await svc.matchMusic(id, server);
			return ok(c, "匹配成功", result);
		} catch (err) {
			return mapError(c, err, [
				["参数", std400(c)],
				["限流", std429(c)],
				["未找到", std404(c)],
			]);
		}
	});

	// GET /api/v1/ncmget?id=&br=
	app.get("/api/v1/ncmget", async (c) => {
		const id = c.req.query("id") ?? "";
		const br = c.req.query("br") ?? "";
		if (!id) return badRequest(c, "音乐ID不能为空");
		try {
			const result = await svc.getNCMMusic(id, br);
			return ok(c, "获取成功", result);
		} catch (err) {
			return mapError(c, err, [
				["参数", std400(c)],
				["音质", std400(c)],
				["限流", std429(c)],
				["不可用", std503(c)],
			]);
		}
	});

	// GET /api/v1/other?name=
	app.get("/api/v1/other", async (c) => {
		const name = c.req.query("name") ?? "";
		if (!name) return badRequest(c, "歌曲名称不能为空");
		try {
			const result = await svc.getOtherMusic(name);
			return ok(c, "获取成功", result);
		} catch (err) {
			return mapError(c, err, [
				["参数", std400(c)],
				["限流", std429(c)],
				["未找到", std404(c)],
			]);
		}
	});

	// GET /api/v1/search?keyword=&sources=&limit=
	app.get("/api/v1/search", async (c) => {
		const keyword = c.req.query("keyword") ?? "";
		if (!keyword) return badRequest(c, "搜索关键词不能为空");
		const sourcesParam = c.req.query("sources") ?? "";
		const sources = sourcesParam
			? sourcesParam
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean)
			: [];
		let limit = Number.parseInt(c.req.query("limit") ?? "20", 10);
		if (Number.isNaN(limit) || limit <= 0) limit = 20;
		if (limit > 100) limit = 100;
		try {
			const results = await svc.searchMusic(keyword, sources);
			return ok(c, "搜索成功", results.slice(0, limit));
		} catch (err) {
			return mapError(c, err, [
				["参数", std400(c)],
				["限流", std429(c)],
			]);
		}
	});

	// GET /api/v1/info?source=&id=
	app.get("/api/v1/info", async (c) => {
		const source = c.req.query("source") ?? "";
		const id = c.req.query("id") ?? "";
		if (!source) return badRequest(c, "音源名称不能为空");
		if (!id) return badRequest(c, "音乐ID不能为空");
		try {
			const info = await svc.getMusicInfo(source, id);
			return ok(c, "获取成功", info);
		} catch (err) {
			return mapError(c, err, [
				["参数", std400(c)],
				["限流", std429(c)],
				["不可用", std503(c)],
				["未找到", std404(c)],
			]);
		}
	});

	// GET /api/v1/picture?source=&id=&size=
	app.get("/api/v1/picture", async (c) => {
		const source = c.req.query("source") ?? "gdstudio";
		const picID = c.req.query("id") ?? "";
		const size = c.req.query("size") ?? "300";
		if (!picID) return badRequest(c, "专辑图ID不能为空");
		if (source !== "gdstudio") return badRequest(c, "当前仅支持gdstudio音源");
		if (size !== "300" && size !== "500")
			return badRequest(c, "尺寸只能是300或500");
		try {
			const url = await svc.getPicture(source, picID, size);
			return ok(c, "获取成功", { url });
		} catch (err) {
			return internalError(
				c,
				`获取专辑图失败: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	});

	// GET /api/v1/lyric?source=&id=
	app.get("/api/v1/lyric", async (c) => {
		const source = c.req.query("source") ?? "gdstudio";
		const lyricID = c.req.query("id") ?? "";
		if (!lyricID) return badRequest(c, "歌词ID不能为空");
		if (source !== "gdstudio") return badRequest(c, "当前仅支持gdstudio音源");
		try {
			const { lyric, tlyric } = await svc.getLyric(source, lyricID);
			return ok(c, "获取成功", { lyric, tlyric });
		} catch (err) {
			return internalError(
				c,
				`获取歌词失败: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	});

	return app;
}
