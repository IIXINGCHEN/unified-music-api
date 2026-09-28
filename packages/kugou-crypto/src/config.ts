// 平台默认配置（源自 KuGouMusicApi util/config.json）
// 注意：wx/qq 的 appid 与 secret 是原开源仓库自带的第三方应用凭证（随仓库公开发布），
// 此处保留原公开值以保证与原版一致的开箱行为；生产环境请用同名环境变量替换为自己的凭证。
const env = (k: string, d: string): string => process.env[k] ?? d;
const envInt = (k: string, d: number): number => {
	const v = process.env[k];
	return v === undefined || v === "" ? d : Number(v);
};
export const appid = envInt("KUGOU_APPID", 1005);
export const clientver = envInt("KUGOU_CLIENTVER", 20489);
export const liteAppid = envInt("KUGOU_LITE_APPID", 3116);
export const liteClientver = envInt("KUGOU_LITE_CLIENTVER", 11440);
export const apiver = envInt("KUGOU_APIVER", 20);
export const srcappid = envInt("KUGOU_SRCAPPID", 2919);
export const wx_appid = env("KUGOU_WX_APPID", "wx79f2c4418704b4f8");
export const wx_lite_appid = env("KUGOU_WX_LITE_APPID", "wx72b795aca60ad321");
export const wx_secret = env("KUGOU_WX_SECRET", "<redacted>");
export const wx_lite_secret = env("KUGOU_WX_LITE_SECRET", "<redacted>");
export const qq_appid = env("KUGOU_QQ_APPID", "205141");
export const qq_lite_appid = env("KUGOU_QQ_LITE_APPID", "101706348");
