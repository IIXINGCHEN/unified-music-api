// 获取指定维度音乐排行榜列表
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		chartCode: query.chartCode,
		targetId: query.targetId,
		targetType: query.targetType,
	};
	return request(`/api/chart/song/detail`, data, createOption(query));
});
