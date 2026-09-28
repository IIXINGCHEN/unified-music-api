// 多级行政区划数据获取接口
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		bizCode: query.bizCode || "",
	};
	return request(`/api/lbs/city/code`, data, createOption(query));
});
