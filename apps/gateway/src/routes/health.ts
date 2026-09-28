/**
 * Health routes: /health /ready /metrics /healthz /readyz /startupz
 *
 * Ports Go `internal/controller/health_controller.go` (RegisterHealthRoutes).
 * /metrics keeps the JSON envelope semantics (never Prometheus text).
 */
import { Hono } from "hono";
import { ok, send } from "../response.js";
import type { HealthChecker, MetricsCollector } from "../services.js";

export function healthRoutes(
	health: HealthChecker,
	metrics: MetricsCollector,
): Hono {
	const app = new Hono();

	app.get("/health", (c) => {
		const results = health.check();
		const healthy = health.isHealthy();
		const data = {
			status: healthy ? "healthy" : "unhealthy",
			timestamp: Math.floor(Date.now() / 1000),
			uptime: health.uptime(),
			checks: results,
		};
		if (healthy) return ok(c, "服务健康", data);
		return send(c, 503, 503, "服务不健康", data);
	});

	app.get("/ready", (c) => {
		const ready = health.isHealthy();
		const data = {
			status: ready ? "healthy" : "unhealthy",
			timestamp: Math.floor(Date.now() / 1000),
			uptime: health.uptime(),
		};
		if (ready) return ok(c, "服务就绪", data);
		return send(c, 503, 503, "服务未就绪", data);
	});

	// JSON envelope metrics (not Prometheus text) - matches Go behavior.
	app.get("/metrics", (c) => ok(c, "指标获取成功", metrics.snapshot()));

	app.get("/healthz", (c) =>
		ok(c, "服务存活", {
			status: "alive",
			timestamp: Math.floor(Date.now() / 1000),
			uptime: health.uptime(),
		}),
	);

	app.get("/readyz", (c) => {
		const ready = health.isHealthy();
		const data = {
			status: ready ? "healthy" : "unhealthy",
			timestamp: Math.floor(Date.now() / 1000),
		};
		if (ready) return ok(c, "服务就绪", data);
		return send(c, 503, 503, "服务未就绪", data);
	});

	app.get("/startupz", (c) => {
		// Go: service is "started" after 30s uptime.
		const started = Date.now() - startupAt >= 30_000;
		const data = {
			status: started ? "healthy" : "unhealthy",
			timestamp: Math.floor(Date.now() / 1000),
			uptime: health.uptime(),
		};
		if (started) return ok(c, "服务已启动", data);
		return send(c, 503, 503, "服务启动中", data);
	});

	return app;
}

const startupAt = Date.now();
