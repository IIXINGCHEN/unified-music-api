// 广播电台 - 电台信息
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	const data = {
		channelId: query.id,
	};
	return request(
		`/api/voice/broadcast/channel/currentinfo`,
		data,
		createOption(query),
	);
});
