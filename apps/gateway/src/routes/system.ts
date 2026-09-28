/**
 * System routes: /api/v1/system/*, /api/v1/version, /api/v1/ping
 *
 * Ports Go `internal/controller/system_controller.go`.
 */
import { Hono } from "hono";
import { internalError, ok, serviceUnavailable } from "../response.js";
import type { SystemService } from "../services.js";

export function systemRoutes(svc: SystemService): Hono {
	const app = new Hono();

	app.get("/api/v1/system/info", async (c) => {
		try {
			return ok(c, "获取成功", svc.getSystemInfo());
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	app.get("/api/v1/system/health", async (c) => {
		try {
			const health = svc.getHealthStatus();
			if (health.healthy) return ok(c, "健康检查通过", health);
			return serviceUnavailable(c, "健康检查失败");
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	app.get("/api/v1/system/metrics", async (c) => {
		try {
			return ok(c, "获取成功", svc.getMetrics());
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	app.get("/api/v1/system/sources", async (c) => {
		try {
			return ok(c, "获取成功", await svc.getSourcesStatus());
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	app.post("/api/v1/system/sources/refresh", async (c) => {
		try {
			await svc.refreshSources();
			return ok(c, "刷新成功");
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	app.get("/api/v1/system/cache/stats", async (c) => {
		try {
			return ok(c, "获取成功", svc.getCacheStats());
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	app.post("/api/v1/system/cache/clear", async (c) => {
		try {
			svc.clearCache();
			return ok(c, "清空成功");
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	// compat endpoints (Go registers these on the v1 group)
	app.get("/api/v1/version", (c) =>
		ok(c, "获取成功", { version: svc.getVersion() }),
	);

	app.get("/api/v1/ping", (c) => {
		if (svc.isHealthy()) {
			return ok(c, "pong", {
				status: "healthy",
				timestamp: Math.floor(Date.now() / 1000),
			});
		}
		return serviceUnavailable(c, "服务不健康");
	});

	return app;
}
