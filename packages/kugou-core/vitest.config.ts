// vitest 用：@music-api/kugou-crypto 尚未在 package.json 声明 exports，
// 此处 alias 到其源码，保证测试期解析。生产级修复（给 crypto 包加 exports）
// 由 P5 统一处理，见本包各源码文件头的偏差声明。
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@music-api/kugou-crypto": fileURLToPath(
				new URL("../kugou-crypto/src/index.ts", import.meta.url),
			),
		},
	},
});
