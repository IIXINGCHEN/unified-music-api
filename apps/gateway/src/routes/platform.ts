/**
 * Platform reverse proxy: GET/POST /api/v1/platform/:name/*path
 *
 * Ports Go `internal/controller/platform_controller.go`:
 * - upstream per platform, env override PLATFORM_{NAME}_URL
 * - unknown platform -> 404 envelope "未知平台: ..."
 * - upstream failure -> 502 envelope { code: 502, message: "平台服务不可用: X", platform: X }
 * - path join keeps raw query; User-Agent forwarded.
 */

import type { Context } from "hono";
import { Hono } from "hono";
import { platformUpstream } from "../config.js";
import { notFound } from "../response.js";

function singleJoiningSlash(a: string, b: string): string {
	const aSlash = a.endsWith("/");
	const bSlash = b.startsWith("/");
	if (aSlash && bSlash) return a + b.slice(1);
	if (!aSlash && !bSlash) return `${a}/${b}`;
	return a + b;
}

async function proxyHandler(c: Context) {
	const name = c.req.param("name") ?? "";
	const target = platformUpstream(name);
	if (!target) {
		return notFound(
			c,
			`未知平台: ${name}，可用平台: netease, kugou, unm, lyric, meting`,
		);
	}

	let targetUrl: URL;
	try {
		targetUrl = new URL(target);
	} catch {
		return c.json(
			{
				code: 500,
				message: "平台上游地址配置错误",
				timestamp: Math.floor(Date.now() / 1000),
			},
			500,
		);
	}

	// part after /api/v1/platform/:name (keeps leading slash like Go's wildcard param)
	const fullPath = new URL(c.req.url).pathname;
	const prefix = `/api/v1/platform/${name}`;
	let rest =
		fullPath.length > prefix.length ? fullPath.slice(prefix.length) : "/";
	if (rest === "" || rest === "/") rest = "/";

	const basePath = targetUrl.pathname.replace(/\/$/, "");
	const rawQuery = new URL(c.req.url).search;
	const finalUrl = `${targetUrl.origin}${singleJoiningSlash(basePath, rest)}${rawQuery}`;

	const headers = new Headers();
	c.req.raw.headers.forEach((v, k) => {
		const lk = k.toLowerCase();
		if (lk === "host" || lk === "connection" || lk === "content-length") return;
		headers.set(k, v);
	});

	let body: BodyInit | undefined;
	if (c.req.method !== "GET" && c.req.method !== "HEAD") {
		const buf = await c.req.arrayBuffer();
		if (buf.byteLength > 0) body = buf;
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 30_000);
	try {
		const res = await fetch(finalUrl, {
			method: c.req.method,
			headers,
			body,
			signal: controller.signal,
			redirect: "manual",
		});
		const outHeaders = new Headers();
		res.headers.forEach((v, k) => {
			const lk = k.toLowerCase();
			if (
				lk === "content-length" ||
				lk === "transfer-encoding" ||
				lk === "connection"
			)
				return;
			outHeaders.append(k, v);
		});
		return new Response(res.body, { status: res.status, headers: outHeaders });
	} catch (err) {
		console.error(`平台代理失败 platform=${name} target=${target}:`, err);
		return c.json(
			{
				code: 502,
				message: `平台服务不可用: ${name}`,
				platform: name,
				timestamp: Math.floor(Date.now() / 1000),
			},
			502,
		);
	} finally {
		clearTimeout(timer);
	}
}

export function platformRoutes(): Hono {
	const app = new Hono();
	app.all("/api/v1/platform/:name", proxyHandler);
	app.all("/api/v1/platform/:name/*", proxyHandler);
	return app;
}
