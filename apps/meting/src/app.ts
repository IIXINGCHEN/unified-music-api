/**
 * Hono app assembly — port of Meting-API/app.js.
 *
 * Routes: GET /api, GET /test, GET / (status page), GET /health.
 */

import { createRequire } from "node:module";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { getOverseas, getPort } from "./config.js";
import api from "./service/api.js";
import { handler as testHandler } from "./template.js";
import { get_runtime, get_url } from "./util.js";

export function createApp(): Hono {
	const app = new Hono();

	app.use("*", cors());
	app.use("*", logger());
	app.get("/api", api);
	app.get("/test", testHandler);
	app.get("/health", (c) => c.json({ status: "ok", service: "meting" }));

	// API 文档（Scalar）：spec 来自 apps/meting/openapi.json（scripts/gen-openapi.mjs 生成）
	app.get(
		"/docs",
		Scalar({
			spec: {
				content: createRequire(import.meta.url)("../openapi.json") as Record<
					string,
					unknown
				>,
			},
		}),
	);
	app.get("/", (c) => {
		const base = get_url(c);
		return c.html(`
                    <html>
                        <head>
                            <title>Meting正在运行</title>
                        </head>
                        <body>
                            <h1>Meting API</h1>
                            <p>
                                <a href="https://github.com/xizeyoupan/Meting-API" style="text-decoration: none;">
                                    <img alt="Static Badge" src="https://img.shields.io/badge/Github-Meting-green">
                                    <img alt="GitHub forks" src="https://img.shields.io/github/forks/xizeyoupan/Meting-API">
                                    <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/xizeyoupan/Meting-API">
                                </a>
                            </p>

                            <p>当前版本：2.0.0</p>
                            <p>当前运行环境：${get_runtime()}</p>
                            <p>当前时间：${new Date()}</p>
                            <p>内部端口：${getPort()}</p>
                            <p>部署在大陆：${getOverseas() ? "否" : "是"}</p>
                            <p>当前地址：<a>${c.req.url}</a></p>
                            <p>实际地址：<a>${base}</a></p>
                            <p>测试地址：<a href="${base}test">${base}test</a></p>
                            <p>api地址：<a href="${base}api">${base}api</a></p>

                        </body>
                    </html>`);
	});

	return app;
}

export const app = createApp();
export default app;
