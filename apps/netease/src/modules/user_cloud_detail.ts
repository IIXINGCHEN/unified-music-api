// 云盘数据详情
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const id = query.id.replace(/\s/g, "").split(",");
	const data = {
		songIds: id,
	};
	return request(`/api/v1/cloud/get/byids`, data, createOption(query, "weapi"));
});
