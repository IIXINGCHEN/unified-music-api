// 私人 DJ
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

// 实际请求参数如下, 部分内容省略, 敏感信息已进行混淆
// 可按需修改此 API 的代码
/* {"extInfo":"{\"lastRequestTimestamp\":1692358373509,\"lbsInfoList\":[{\"lat\":40.23076381,\"lon\":129.07545186,\"time\":1692358543},{\"lat\":40.23076381,\"lon\":129.07545186,\"time\":1692055283}],\"listenedTs\":false,\"noAidjToAidj\":true}","header":"{}"} */

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noExplicitAny: upstream JSON is untyped
	var extInfo: Record<string, any> = {};
	// biome-ignore lint/suspicious/noDoubleEquals: query params arrive as strings; loose equality is intentional (matches original)
	if (query.latitude != undefined) {
		extInfo.lbsInfoList = [
			{
				lat: query.latitude,
				lon: query.longitude,
				time: Date.now() / 1000,
			},
		];
	}
	extInfo.noAidjToAidj = false;
	extInfo.lastRequestTimestamp = Date.now();
	extInfo.listenedTs = false;
	const data = {
		extInfo: JSON.stringify(extInfo),
	};
	// logger.info(data)
	return request(`/api/aidj/content/rcmd/info`, data, createOption(query));
});
