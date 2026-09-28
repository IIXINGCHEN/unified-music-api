/**
 * Dev entry (`pnpm dev` -> `tsx watch src/index.ts`).
 * Production entry is also available as `node dist/index.js`.
 */
import { start } from "./main.js";

try {
	start();
} catch (err) {
	console.error("启动失败:", err);
	process.exit(1);
}

export { createApp, isSecurityEnabled } from "./app.js";
export { loadConfig, platformUpstream } from "./config.js";
