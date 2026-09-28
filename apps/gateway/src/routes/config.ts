/**
 * Config routes: /api/v1/config*
 *
 * Ports Go `internal/controller/config_controller.go`. All reads return the
 * production-sanitized config (Go utils.SanitizeForProduction).
 */
import { Hono } from "hono";
import type { GatewayConfig } from "../config.js";
import { badRequest, fail, internalError, ok } from "../response.js";
import type { ConfigService } from "../services.js";

function isNotFound(err: unknown): boolean {
	return err instanceof Error && "notFound" in err;
}

export function configRoutes(svc: ConfigService): Hono {
	const app = new Hono();

	app.get("/api/v1/config", async (c) => {
		try {
			return ok(c, "获取成功", svc.getSanitizedConfig());
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	app.put("/api/v1/config", async (c) => {
		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return badRequest(c, "请求体必须是合法 JSON");
		}
		try {
			svc.updateConfig(body as GatewayConfig);
			return ok(c, "更新成功");
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (err instanceof Error && "validation" in err)
				return badRequest(c, msg);
			return internalError(c, msg);
		}
	});

	app.get("/api/v1/config/backups", async (c) => {
		try {
			return ok(c, "获取成功", svc.getBackups());
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	app.get("/api/v1/config/:section", async (c) => {
		const section = c.req.param("section") ?? "";
		if (!section) return badRequest(c, "配置节名称不能为空");
		try {
			return ok(c, "获取成功", svc.getSection(section));
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (isNotFound(err)) return fail(c, 404, 404, msg);
			return internalError(c, msg);
		}
	});

	app.put("/api/v1/config/:section", async (c) => {
		const section = c.req.param("section") ?? "";
		if (!section) return badRequest(c, "配置节名称不能为空");
		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return badRequest(c, "请求体必须是合法 JSON");
		}
		try {
			svc.updateSection(section, body);
			return ok(c, "更新成功");
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (isNotFound(err)) return fail(c, 404, 404, msg);
			return internalError(c, msg);
		}
	});

	app.post("/api/v1/config/validate", async (c) => {
		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return badRequest(c, "请求体必须是合法 JSON");
		}
		try {
			const result = svc.validateConfig(body as GatewayConfig);
			return ok(c, "验证完成", result);
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	app.post("/api/v1/config/reload", async (c) => {
		try {
			svc.reloadConfig();
			return ok(c, "重新加载成功");
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	app.post("/api/v1/config/backup", async (c) => {
		let body: { name?: string; description?: string };
		try {
			body = (await c.req.json()) as { name?: string; description?: string };
		} catch {
			return badRequest(c, "请求体必须是合法 JSON");
		}
		if (!body?.name) return badRequest(c, "备份名称不能为空");
		try {
			const backup = svc.backupConfig(body.name, body.description ?? "");
			return ok(c, "备份成功", backup);
		} catch (err) {
			return internalError(c, err instanceof Error ? err.message : String(err));
		}
	});

	app.post("/api/v1/config/backup/:backup_id/restore", async (c) => {
		const backupID = c.req.param("backup_id") ?? "";
		if (!backupID) return badRequest(c, "备份ID不能为空");
		try {
			svc.restoreConfig(backupID);
			return ok(c, "恢复成功");
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (isNotFound(err)) return fail(c, 404, 404, msg);
			return internalError(c, msg);
		}
	});

	app.delete("/api/v1/config/backup/:backup_id", async (c) => {
		const backupID = c.req.param("backup_id") ?? "";
		if (!backupID) return badRequest(c, "备份ID不能为空");
		try {
			svc.deleteBackup(backupID);
			return ok(c, "删除成功");
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (isNotFound(err)) return fail(c, 404, 404, msg);
			return internalError(c, msg);
		}
	});

	return app;
}
