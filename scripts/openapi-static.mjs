#!/usr/bin/env node
/**
 * openapi-static.mjs — unm / lyric / meting / gateway 的手写 OpenAPI spec。
 *
 * 参数取自各 app 源码（zod schema / c.req.query("...") 调用点），尽量准确。
 * 由 scripts/gen-openapi.mjs 导入并落盘为 apps/<app>/openapi.{yaml,json}。
 */
import { jsonOk, makeSpec, op, pp, qp } from "./openapi-emit.mjs";

const VERSION = "2.0.0";

// ------------------------------------------------------------------ unm
function unmSpec() {
	const bearer = {
		401: {
			description: "缺少/错误的监控密钥",
			content: { "application/json": { schema: { type: "object" } } },
		},
	};
	const paths = {
		"/info": { get: op("服务信息（name/version/功能开关）") },
		"/health": { get: op("健康检查") },
		"/ping": { get: op("存活探针") },
		"/match": {
			get: op("按歌曲 id 匹配可播放音源", [
				qp("id", { required: true, description: "歌曲 id" }),
				qp("server", { description: "音源,逗号分隔；缺省自动选择" }),
				qp("br", { description: "目标比特率" }),
			]),
		},
		"/ncmget": {
			get: op("网易云直链获取", [
				qp("id", { required: true, description: "歌曲 id" }),
				qp("br", { description: "目标比特率" }),
			]),
		},
		"/otherget": {
			get: op("按曲名搜索第三方音源", [
				qp("name", { required: true, description: "曲名（可含歌手）" }),
			]),
		},
		"/test": { get: op("快速匹配演示（独立紧限流）") },
		"/search": {
			get: op("资源搜索", [
				qp("name", { required: true, description: "搜索关键词" }),
				qp("source", { description: "指定音源" }),
				qp("count", { description: "每页数量" }),
				qp("pages", { description: "页数" }),
				qp("page", { description: "页码" }),
			]),
		},
		"/pic": {
			get: op("封面图片", [
				qp("id", { required: true }),
				qp("source", { description: "指定音源" }),
				qp("size", { description: "尺寸 px" }),
			]),
		},
		"/picture": {
			get: op("封面图片（/pic 别名）", [
				qp("id", { required: true }),
				qp("source", { description: "指定音源" }),
				qp("size", { description: "尺寸 px" }),
			]),
		},
		"/lyric": {
			get: op("歌词（含翻译/罗马音兜底）", [
				qp("id", { required: true }),
				qp("source", { description: "指定音源" }),
				qp("name", { description: "曲名（兜底匹配用）" }),
				qp("artist", { description: "歌手（兜底匹配用）" }),
				qp("album", { description: "专辑（兜底匹配用）" }),
				qp("duration", { description: "时长秒（兜底匹配用）" }),
			]),
		},
		"/playlist/{id}": {
			get: op("歌单详情", [pp("id", { description: "歌单 id" })]),
		},
		"/relay": {
			get: op("媒体 URL 中转（防盗链 Referer 注入）", [
				qp("url", { required: true, description: "上游媒体 URL" }),
			]),
		},
		"/api/monitor/data": {
			get: op("监控审计数据（需 Bearer 监控密钥）", [], {
				description:
					"请求头 Authorization: Bearer <MONITOR_SECRET_KEY>；无密钥时进程拒绝启动（原版安全行为）。",
				responses: { 200: jsonOk(), ...bearer },
			}),
		},
		"/api/monitor/clear": {
			post: op("清空监控数据（需 Bearer 监控密钥）", [], {
				responses: { 200: jsonOk(), ...bearer },
			}),
		},
		"/dashboard": { get: op("监控面板（HTML）") },
		"/monitor": { get: op("监控面板别名（HTML）") },
	};
	return makeSpec({
		title: "UNM 解灰服务 (v2 · Hono)",
		version: VERSION,
		description:
			"unm-music-api 迁移版：歌曲匹配/直链/搜索/封面/歌词/歌单/中转。鉴权区需 MONITOR_SECRET_KEY。",
		serverUrl: "http://localhost:3003",
		paths,
	});
}

// ------------------------------------------------------------------ lyric
function lyricSpec() {
	const paths = {
		"/health": { get: op("健康检查") },
		"/api/": { get: op("服务根（运行状态消息）") },
		"/api/search": {
			get: op("按网易云歌曲 id 搜索歌词", [
				qp("id", { required: true, description: "网易云歌曲 id" }),
				qp("fallback", { description: "主源无结果时回退查询" }),
				qp("fixedVersion", { description: "锁定指定版本" }),
			]),
		},
		"/api/lyrics/meta": {
			get: op("歌词元数据", [
				qp("id", { required: true, description: "网易云歌曲 id" }),
			]),
		},
	};
	return makeSpec({
		title: "Lyric Atlas API (v2 · Hono)",
		version: VERSION,
		description:
			"Lyric-Atlas-API 迁移版（Vercel Edge → Node）。需环境变量 EXTERNAL_NCM_API_URL 指向网易云服务；未设置时搜索接口返回 500（原版行为）。",
		serverUrl: "http://localhost:3004",
		paths,
	});
}

// ------------------------------------------------------------------ meting
function metingSpec() {
	const paths = {
		"/health": { get: op("健康检查") },
		"/": { get: op("状态页（HTML）") },
		"/test": { get: op("演示页（HTML）") },
		"/api": {
			get: op("Meting 聚合解析", [
				qp("server", {
					description: "音源: spotify | ytmusic（默认 spotify）",
				}),
				qp("type", {
					description: "song | playlist | url | pic | lrc（默认 playlist）",
				}),
				qp("id", { description: "曲目/歌单 id（默认 7326220405）" }),
			]),
		},
	};
	return makeSpec({
		title: "Meting API (v2 · Hono/TS)",
		version: VERSION,
		description:
			"Meting-API TypeScript 移植版。P4 决议：仅保留 spotify/ytmusic provider（tencent/netease 已由原生服务覆盖）；server=tencent|netease 返回 400。type=url 无直链时 403；url 以 @ 开头时返回文本。",
		serverUrl: "http://localhost:3005",
		paths,
	});
}

// ------------------------------------------------------------------ gateway
function gatewaySpec() {
	const authNote =
		"鉴权区：需满足网关鉴权配置（默认关闭时直接通过；开启后缺凭证 401）。";
	const paths = {
		"/health": { get: op("健康检查（免认证）") },
		"/ready": { get: op("就绪探针（免认证）") },
		"/metrics": {
			get: op("运行指标（JSON 信封，非 Prometheus 文本）", [], {
				description: "保持 JSON 信封语义，不伪装成 Prometheus 格式。",
			}),
		},
		"/healthz": { get: op("健康检查别名") },
		"/readyz": { get: op("就绪探个别名") },
		"/startupz": { get: op("启动探针") },
		"/api/v1/match": {
			get: op("网关原生：歌曲匹配", [
				qp("id", { description: "歌曲 id" }),
				qp("server", { description: "音源" }),
			]),
		},
		"/api/v1/ncmget": {
			get: op("网关原生：网易云直链", [qp("id"), qp("br")]),
		},
		"/api/v1/other": {
			get: op("网关原生：第三方音源搜索", [qp("name")]),
		},
		"/api/v1/search": {
			get: op("网关原生：聚合搜索", [
				qp("keyword", { description: "关键词" }),
				qp("sources", { description: "音源列表,逗号分隔" }),
				qp("limit", { description: "每源数量" }),
			]),
		},
		"/api/v1/info": {
			get: op("网关原生：歌曲信息", [qp("source"), qp("id")]),
		},
		"/api/v1/picture": {
			get: op("网关原生：封面", [qp("source"), qp("id"), qp("size")]),
		},
		"/api/v1/lyric": {
			get: op("网关原生：歌词", [qp("source"), qp("id")]),
		},
		"/api/v1/platform/{name}": {
			get: op(
				"平台反代（路径级）",
				[pp("name", { description: "平台名: netease|kugou|unm|lyric|meting" })],
				{
					description:
						"反代到对应平台服务根路径；上游不可用时 502 {code,message} 信封。",
				},
			),
			post: op("平台反代（路径级）", [pp("name")]),
		},
		"/api/v1/platform/{name}/{path}": {
			get: op("平台反代（子路径透传）", [
				pp("name"),
				pp("path", { description: "透传子路径" }),
			]),
			post: op("平台反代（子路径透传）", [pp("name"), pp("path")]),
		},
		"/api/v1/system/info": {
			get: op("系统信息", [], { description: authNote }),
		},
		"/api/v1/system/health": {
			get: op("系统健康", [], { description: authNote }),
		},
		"/api/v1/system/metrics": {
			get: op("系统指标", [], { description: authNote }),
		},
		"/api/v1/system/sources": {
			get: op("音源列表", [], { description: authNote }),
		},
		"/api/v1/system/sources/refresh": {
			post: op("刷新音源", [], { description: authNote }),
		},
		"/api/v1/system/cache/stats": {
			get: op("缓存统计", [], { description: authNote }),
		},
		"/api/v1/system/cache/clear": {
			post: op("清空缓存", [], { description: authNote }),
		},
		"/api/v1/version": { get: op("版本信息") },
		"/api/v1/ping": { get: op("存活探针") },
		"/api/v1/config": {
			get: op("查看配置（脱敏）", [], { description: authNote }),
		},
		"/api/v1/config/backups": {
			get: op("配置备份列表", [], { description: authNote }),
		},
		"/api/v1/config/{section}": {
			get: op("查看配置分节", [pp("section")], { description: authNote }),
		},
		"/api/v1/config/validate": {
			post: op("校验配置", [], { description: authNote }),
		},
		"/api/v1/config/reload": {
			post: op("重载配置", [], { description: authNote }),
		},
		"/api/v1/config/backup": {
			post: op("创建配置备份", [], { description: authNote }),
		},
		"/api/v1/config/backup/{backup_id}/restore": {
			post: op("从备份恢复配置", [pp("backup_id")], { description: authNote }),
		},
		"/": { get: op("网关首页（HTML）") },
		"/api": { get: op("API 索引") },
		"/api/v1": { get: op("API v1 索引") },
	};
	return makeSpec({
		title: "统一网关 (v2 · Hono)",
		version: VERSION,
		description:
			"Go/Gin 网关的 Hono 重写版：5 平台反代、鉴权、UA/IP 白名单、限流、缓存、system/config 管理 API。/metrics 为 JSON 信封。插件框架与热加载不保留。",
		serverUrl: "http://localhost:5678",
		paths,
	});
}

export const STATIC_SPECS = {
	unm: unmSpec,
	lyric: lyricSpec,
	meting: metingSpec,
	gateway: gatewaySpec,
};
