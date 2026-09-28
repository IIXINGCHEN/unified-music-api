// 云小编每日签到
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	return request(`/api/rep/ugc/user/sign`, {}, createOption(query, "eapi"));
});
