// 黑胶时光机
import {
	createOption,
	defineModule,
	type NcmQuery,
	type NcmRequestFn,
} from "@music-api/ncm-core";

export default defineModule((query: NcmQuery, request: NcmRequestFn) => {
	// biome-ignore lint/suspicious/noExplicitAny: upstream JSON is untyped
	const data: Record<string, any> = {};
	if (query.startTime && query.endTime) {
		data.startTime = query.startTime;
		data.endTime = query.endTime;
		data.type = 1;
		data.limit = query.limit || 60;
	}
	return request(
		`/api/vipmusic/newrecord/weekflow`,
		data,
		createOption(query, "weapi"),
	);
});
