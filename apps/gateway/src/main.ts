/**
 * Gateway entrypoint.
 *
 * Mirrors Go cmd/music-api-proxy/main.go: load config -> validate -> build app
 * -> serve (PORT/HOST) -> graceful shutdown on SIGINT/SIGTERM (30s).
 */
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { findConfigFile, loadConfig } from "./config.js";

export interface StartOptions {
	configPath?: string;
	port?: number;
	host?: string;
}

export function start(opts: StartOptions = {}) {
	const configPath =
		opts.configPath ?? process.env.CONFIG_PATH ?? findConfigFile() ?? undefined;
	const cfg = loadConfig(configPath);

	console.log(
		`Music API Proxy ${process.env.APP_VERSION ?? cfg.app.version} (mode: ${cfg.app.mode})`,
	);
	if (configPath) console.log(`配置文件: ${configPath}`);
	else console.log("未找到配置文件，使用默认配置 + 环境变量");

	if (cfg.security.tls_enabled) {
		console.warn(
			"tls_enabled=true，但 @hono/node-server 不直接支持 TLS；请在反向代理层终止 TLS（见 parity 文档）。",
		);
	}

	const { app } = createApp(cfg, { configPath: configPath ?? null });
	const port = opts.port ?? Number(process.env.PORT ?? 0) ?? cfg.server.port;
	const host = opts.host ?? process.env.HOST ?? cfg.server.host;

	const server = serve({ fetch: app.fetch, port, hostname: host }, (info) => {
		console.log(`HTTP服务器启动: http://${info.address}:${info.port}`);
	});

	const shutdown = () => {
		console.log("收到关闭信号，正在优雅关闭服务器...");
		const timer = setTimeout(() => {
			console.error("优雅关闭超时，强制退出");
			process.exit(1);
		}, 30_000);
		timer.unref();
		server.close((err) => {
			clearTimeout(timer);
			if (err) {
				console.error("服务器关闭失败:", err);
				process.exit(1);
			} else {
				console.log("服务器已优雅关闭");
				process.exit(0);
			}
		});
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);

	return { app, server, config: cfg };
}

// Run when executed directly (node dist/main.js / tsx src/main.ts).
const isMain =
	process.argv[1]?.endsWith("/main.js") ||
	process.argv[1]?.endsWith("/main.ts");
if (isMain) {
	try {
		start();
	} catch (err) {
		console.error("启动失败:", err);
		process.exit(1);
	}
}
